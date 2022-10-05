import { createStarryNight, all } from '@wooorm/starry-night';
import { getColor } from './color';
import type { RootContent } from 'hast';

const starryNight = createStarryNight(all);

interface CodeTree {
  language: string;
  spans: string[];
  nodes: Code[];
}

type Code = CodeTree | string;

type TaggedFunction = (code: TemplateStringsArray, ...rest: Code[]) => CodeTree;
type LanguageDictionary = Record<string, TaggedFunction>;
const handler = {
  get(_: null, language: string): TaggedFunction {
    return (code: TemplateStringsArray, ...rest: Code[]): CodeTree => {
      return {
        language,
        spans: Array.from(code),
        nodes: rest,
      };
    };
  },
};

export const language = new Proxy<LanguageDictionary>({}, handler);

interface Token {
  code: string;
  color: string | null;
  morph?: 'create' | 'delete' | 'retain';
}

export async function parse(code: CodeTree): Promise<Token[]> {
  const raw = integrate(code);
  const sn = await starryNight;
  const scope = sn.flagToScope(code.language);
  if (typeof scope !== 'string') {
    throw new Error(`language ${code.language} not found`);
  }
  const parsed = sn.highlight(raw, scope);
  return parsed.children.map(colorRecurse).flat();
}

function colorRecurse(parsed: RootContent): Token[] {
  if (parsed.type === 'text') {
    return [
      {
        code: parsed.value,
        color: null,
      },
    ];
  } else if (parsed.type === 'element') {
    const className = parsed.properties?.className;
    const color = getColor((className ?? []) as string[]);
    const children = parsed.children.map(colorRecurse);
    const result = [];
    const emit = () => {
      if (temp !== '') {
        if (color != null) {
          result.push({
            code: temp,
            color,
          });
        } else {
          result.push({
            code: temp,
            color: null,
          });
        }
        temp = '';
      }
    };
    let temp = '';
    for (const child of children) {
      for (const item of child) {
        if (item.color === null) {
          temp += item.code;
        } else {
          emit();
          result.push(item);
        }
      }
      emit();
    }
    emit();
    return result;
  } else {
    throw new Error();
  }
}

function integrate(code: Code) {
  if (typeof code === 'string') return code;

  return String.raw(
    { raw: code.spans },
    ...code.nodes.map((n) => integrate(n)),
  );
}

function isLevelEquivilant(one: Code | null, two: Code | null): boolean {
  console.info(`checking if nodes are level equivilant`);
  if (one === null || two === null) return false;
  if (
    (typeof one === 'string' && typeof two !== 'string') ||
    (typeof one !== 'string' && typeof two === 'string')
  ) {
    console.info(`found nodes to be different types`);
    return false;
  }
  if (typeof one === 'string' && typeof two === 'string') {
    console.info(`found nodes to be strings`);
    return one === two;
  }
  if (typeof one !== 'string' && typeof two !== 'string') {
    console.info(`found nodes to be code nodes`);
    if (one.spans.length !== two.spans.length) return false;

    console.info(`found nodes to be the same length`);
    return one.spans.every((span, i) => span === two.spans[i]);
  }
}

function chars(tokens: Token[]): Token[] {
  return tokens.flatMap(({ code, color }) => {
    return code.split('').map((c) => ({
      code: c,
      color,
    }));
  });
}

function tokens(chars: Token[]) {
  const result = [];
  let token = null;
  for (const char of chars) {
    if (token == null) {
      token = char;
    } else {
      if (token.color === char.color && token.morph === char.morph) {
        token.code += char.code;
      } else {
        result.push(token);
        token = char;
      }
    }
  }
  result.push(token);
  return result;
}

export async function diff(start: CodeTree, end: CodeTree) {
  const startParsed = chars(await parse(start));
  const endParsed = chars(await parse(end));
  let index = 0;
  let endex = 0;
  const result = [];
  function recurse(one: Code | null, two: Code | null) {
    const progress = (l: string, r?: string) => {
      if (r == null) r = l;
      console.info(`progressing ${l} and ${r}`);
      const startIndex = index;
      while (index < startIndex + l.length && index < startParsed.length) {
        result.push({
          ...startParsed[index],
          morph: l === r ? 'retain' : 'delete',
        });
        index++;
        console.info(`now at ${index} in startParsed`);
      }
      const endIndex = endex;
      while (
        endex < endIndex + r.length &&
        two !== '' &&
        endex < endParsed.length
      ) {
        if (r !== l) {
          result.push({
            ...endParsed[endex],
            morph: 'create',
          });
        }
        endex++;
        console.info(`now at ${endex} in endParsed`);
      }
    };
    if (isLevelEquivilant(one, two)) {
      console.info(`nodes were found to be level equivilant`);
      if (typeof one === 'string') {
        progress(one);
      } else {
        if (typeof two === 'string') throw new Error();
        for (let n = 0; n < one.nodes.length; n++) {
          progress(one.spans[n]);
          recurse(one.nodes[n], two.nodes[n]);
        }
        progress(one.spans.at(-1));
      }
    } else {
      console.info(`nodes were NOT found to be level equivilant`);
      if (typeof one === 'string' && typeof two === 'string') {
        progress(one, two);
      } else if (typeof one === 'string') {
        progress(one, '');
      } else if (typeof two === 'string') {
        progress('', two);
      }
      if (one != null && typeof one !== 'string') {
        for (let n = 0; n < one.nodes.length; n++) {
          progress(one.spans[n], '');
          recurse(one.nodes[n], null);
        }
        progress(one.spans.at(-1), '');
      }
      if (two != null && typeof two !== 'string') {
        for (let n = 0; n < two.nodes.length; n++) {
          progress('', two.spans[n]);
          recurse(null, two.nodes[n]);
        }
        progress('', two.spans.at(-1));
      }
    }
  }
  recurse(start, end);
  return tokens(result);
}
