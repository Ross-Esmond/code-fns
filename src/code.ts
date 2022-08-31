import { createStarryNight, all, Root } from '@wooorm/starry-night';
import type { RootContent } from 'hast';
import style from './dark-style.json';

const rules = new Map(
  Object.entries(style).map(([k, v]) => [k, new Map(Object.entries(v))]),
);

export function color(input: Char[]): [string, [number, number], string?][] {
  const result: [string, [number, number], string?][] = [];
  let lastColor = Symbol();
  let [ln, at] = [0, 0];
  for (let i = 0; i < input.length; i++) {
    const classList = input[i].classList;
    console.assert(classList.length <= 1, `classList too long`);
    const styles =
      classList.length === 1 ? rules.get(`.${classList[0]}`) : new Map();
    console.assert(styles?.size ?? 0 <= 1, `more styles than just color`);
    const color = styles?.get('color');
    if (input[i].char === '\n') {
      lastColor = Symbol();
      ln++;
      at = 0;
    } else if (color === lastColor) {
      last(result)[0] += input[i].char;
      at++;
    } else {
      const char = input[i].char;
      result.push(color ? [char, [ln, at], color] : [char, [ln, at]]);
      at++;
    }
    lastColor = color;
  }
  return result;
}

const starryNightPromise = createStarryNight(all);

export async function parse(language: string, code: string) {
  const starryNight = await starryNightPromise;
  const scope = starryNight.flagToScope(language);
  if (typeof scope !== 'string')
    throw new Error(`language ${language} not found`);
  const parsed = starryNight.highlight(code, scope);
  // console.log(inspect(parsed, false, null, true))
  const converted = recurse(parsed);
  // console.log(inspect(converted, false, null, true))
  return converted;
}

interface Char {
  char: string;
  classList: string[];
  token: [number, number];
}

interface RepChar extends Char {
  from: 'new' | 'old';
}

interface FormChar extends Char {
  from: 'create' | 'keep' | 'delete';
}

function last<T>(arr: T[][]): T[] {
  if (arr.length === 0) arr.push([]);
  return arr[arr.length - 1];
}

function recurse(
  node: Root | RootContent,
  classes: string[] = [],
  result: Char[] = [],
) {
  if (node.type === 'element') {
    console.assert(node.tagName === 'span', `tag was not a span`);
    const className = (node.properties?.className ?? []) as string[];
    console.assert(Array.isArray(className), `className was not an array`);
    console.assert(className.length >= 1, `tag did not have a className`);
    console.assert(className.length <= 1, `tag had too many classNames`);
    node.children.forEach((child) =>
      recurse(child, [...classes, className[0]], result),
    );
  } else if (node.type === 'root') {
    node.children.forEach((child) => recurse(child, [], result));
  } else if (node.type === 'text') {
    for (let i = 0; i < node.value.length; i++) {
      console.assert(classes.length <= 1, `character has too many classes`);
      result.push({
        char: node.value[i],
        classList: classes,
        token: [i, node.value.length],
      });
    }
  }
  return result;
}

const tagRegex = /^\/\*<[^\S\r\n]*(.*?)[^\S\r\n]*>\*\/$/;

function getSpan(tree: Char[], at: number) {
  const [back, length] = tree[at].token;
  const start = at - back;
  const end = start + length;
  let result = '';
  for (let i = start; i < end; i++) {
    result += tree[i].char;
  }
  return result;
}

export async function substitute(
  language: string,
  code: string | Char[],
  subs: Record<string, string>,
): Promise<RepChar[]> {
  const tree = Array.isArray(code) ? code : await parse(language, code);
  const replacements: [number, number][] = [];
  let final = '';
  tree.forEach((char, at) => {
    if (char.token[0] !== 0) return;
    const span = getSpan(tree, at);
    if (char.classList[0] === 'pl-c' && tagRegex.test(span)) {
      const [, name] = span.match(tagRegex) as [string, string];
      if (name in subs) {
        const rep = subs[name];
        final += rep;
        if (rep !== '') replacements.push([at, rep.length]);
      } else {
        final += span;
      }
    } else {
      final += span;
    }
  });
  const parsed = await parse(language, final);
  let [r, ri] = [0, 0];
  let inReplacement = false;
  return parsed.map((char, at) => {
    if (inReplacement) {
      ri++;
      if (ri === replacements[r][1]) {
        inReplacement = false;
        r++;
      }
    } else if (r < replacements.length) {
      const [rat] = replacements[r];
      if (rat === at) {
        inReplacement = true;
      }
    }

    return {
      ...char,
      from: inReplacement ? 'new' : 'old',
    };
  });
}

export async function transform(
  language: string,
  tree: Char[],
  start: Record<string, string>,
  final: Record<string, string>,
): Promise<FormChar[]> {
  const before = await substitute(language, tree, start);
  const after = await substitute(language, tree, final);
  let [bat] = [0];
  let [aat] = [0];
  const chars: FormChar[] = [];
  while (bat < before.length || aat < after.length) {
    const bchar = before[bat] ?? null;
    const achar = after[aat] ?? null;
    if (bchar?.from === 'old' && achar?.from === 'old') {
      chars.push({
        ...achar,
        from: 'keep',
      });
      bat++;
      aat++;
    } else if (bchar?.from === 'new') {
      chars.push({
        ...bchar,
        from: 'delete',
      });
      bat++;
    } else if (achar?.from === 'new') {
      chars.push({
        ...achar,
        from: 'create',
      });
      aat++;
    }
  }

  return chars;
}

export interface Transition {
  delete: [string, string, [number, number]][];
  create: [string, string, [number, number]][];
  retain: [string, string, [number, number], [number, number]][];
}

export async function transition(
  language: string,
  code: string,
  start: Record<string, string>,
  final: Record<string, string>,
): Promise<Transition> {
  const tree = await parse(language, code);
  const chars = await transform(language, tree, start, final);
  const result: Transition = {
    delete: [],
    create: [],
    retain: [],
  };
  let [dln, dat] = [0, 0];
  let [cln, cat] = [0, 0];
  let lastColor: Symbol | string = Symbol();
  let lastFrom: Symbol | string = Symbol();
  chars.forEach((char) => {
    const classList = char.classList;
    console.assert(classList.length <= 1, `classList too long`);
    const styles =
      classList.length === 1 ? rules.get(`.${classList[0]}`) : new Map();
    console.assert(
      (styles?.size ?? 0) <= 1,
      `more styles than just color`,
      styles,
    );
    const color = styles?.get('color');
    if (char.char === '\n') {
      if (char.from === 'keep' || char.from === 'create') {
        cln++;
        cat = 0;
      }
      if (char.from === 'keep' || char.from === 'delete') {
        dln++;
        dat = 0;
      }
      lastColor = Symbol();
      lastFrom = Symbol();
    } else if (color === lastColor && char.from === lastFrom) {
      if (char.from === 'delete') {
        last(result.delete)[0] += char.char;
        dat++;
      } else if (char.from === 'create') {
        last(result.create)[0] += char.char;
        cat++;
      } else if (char.from === 'keep') {
        last(result.retain)[0] += char.char;
        dat++;
        cat++;
      }
      lastFrom = char.from;
      lastColor = color;
    } else {
      if (char.from === 'delete') {
        result.delete.push([char.char, color, [dln, dat]]);
        dat++;
      } else if (char.from === 'create') {
        result.create.push([char.char, color, [cln, cat]]);
        cat++;
      } else if (char.from === 'keep') {
        result.retain.push([char.char, color, [cln, cat], [dln, dat]]);
        dat++;
        cat++;
      }
      lastFrom = char.from;
      lastColor = color;
    }
  });
  return result;
}
