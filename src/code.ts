import { createStarryNight, all } from '@wooorm/starry-night';
import type { Root, RootContent } from 'hast';
import style from './dark-style.json';

const rules = new Map(
  Object.entries(style).map(([k, v]) => [k, new Map(Object.entries(v))]),
);

export type Parsable = [string, string] | { lang: string; code: string };

export interface Parsed<T extends Char> {
  language: string;
  chars: T[];
}

function ensureParsed(input: Parsed<Char> | Parsable): Parsed<Char> {
  if (Array.isArray(input)) {
    return parse(input[0], input[1]);
  } else if ('code' in input) {
    return parse(input.lang, input.code);
  } else {
    return input as Parsed<Char>;
  }
}

export function tokenColors(
  code: Parsed<Char> | Parsable,
): [string, [number, number], string?][] {
  const input = ensureParsed(code).chars;
  const result: [string, [number, number], string?][] = [];
  let lastColor = Symbol();
  let [ln, at] = [0, 0];
  for (let i = 0; i < input.length; i++) {
    const classList = input[i].classList;
    console.assert(classList.length <= 1, `classList too long`);
    const styles =
      classList.length === 1 ? rules.get(`.${classList[0]}`) : new Map();
    console.assert((styles?.size ?? 0) <= 1, `more styles than just color`);
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

let starryNight: {
  flagToScope: (s: string) => string | undefined;
  highlight: (c: string, s: string) => Root;
} | null = null;
const starryNightPromise = createStarryNight(all);
starryNightPromise.then((sn) => (starryNight = sn));

export function ready() {
  return starryNightPromise;
}

export function toString(code: Parsed<Char> | Parsable): string {
  const parsed = ensureParsed(code);
  const result: string[] = [];
  parsed.chars.forEach(({ char }) => result.push(char));
  return result.join('');
}

export function parse(language: string, code: string): Parsed<Char> {
  if (starryNight == null)
    throw new Error('you must await ready() to initialize package');
  const scope = starryNight.flagToScope(language);
  if (typeof scope !== 'string') {
    throw new Error(`language ${language} not found`);
  }
  const parsed = starryNight.highlight(code, scope);
  const converted = recurse(parsed);
  return {
    language,
    chars: converted,
  };
}

export interface Char {
  char: string;
  classList: string[];
  token: [number, number];
}

export interface RepChar extends Char {
  from: 'new' | 'old';
}

export interface FormChar extends Char {
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

export function substitute(
  code: Parsed<Char> | Parsable,
  subs: Record<string, string>,
): Parsed<RepChar> {
  const parsed = ensureParsed(code);
  const language = parsed.language;
  const tree = parsed.chars;
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
  const reparsed = parse(language, final);
  let [r, ri] = [0, 0];
  let inReplacement = false;
  return {
    language,
    chars: reparsed.chars.map((char: Char, at: number) => {
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
    }),
  };
}

export function transform(
  code: Parsed<Char> | Parsable,
  start: Record<string, string>,
  final: Record<string, string>,
): FormChar[] {
  const tree = ensureParsed(code);
  const before = substitute(tree, start);
  const after = substitute(tree, final);
  let [bat] = [0];
  let [aat] = [0];
  const chars: FormChar[] = [];
  while (bat < before.chars.length || aat < after.chars.length) {
    const bchar = before.chars[bat] ?? null;
    const achar = after.chars[aat] ?? null;
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
  delete: [string, [number, number], string?][];
  create: [string, [number, number], string?][];
  retain: [string, [number, number], [number, number], string?][];
}

export function transition(
  code: Parsed<Char> | Parsable,
  start: Record<string, string>,
  final: Record<string, string>,
): Transition {
  const tree = ensureParsed(code);
  const chars = transform(tree, start, final);
  const result: Transition = {
    delete: [],
    create: [],
    retain: [],
  };
  let [dln, dat] = [0, 0];
  let [cln, cat] = [0, 0];
  let lastColor: symbol | string = Symbol();
  let lastFrom: symbol | string = Symbol();
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
        result.delete.push([
          char.char,
          [dln, dat],
          ...((color ? [color] : []) as [string?]),
        ]);
        dat++;
      } else if (char.from === 'create') {
        result.create.push([
          char.char,
          [cln, cat],
          ...((color ? [color] : []) as [string?]),
        ]);
        cat++;
      } else if (char.from === 'keep') {
        result.retain.push([
          char.char,
          [dln, dat],
          [cln, cat],
          ...((color ? [color] : []) as [string?]),
        ]);
        dat++;
        cat++;
      }
      lastFrom = char.from;
      lastColor = color;
    }
  });
  return result;
}
