import { createStarryNight, all } from '@wooorm/starry-night';
import type { Root, RootContent } from 'hast';
import style from './dark-style.json';

const rules = new Map(
  Object.entries(style).map(([k, v]) => [k, new Map(Object.entries(v))]),
);

export function getColor(classList: string[]): string | undefined {
  console.assert(classList.length <= 1, `classList too long`);
  const styles =
    classList.length === 1 ? rules.get(`.${classList[0]}`) : new Map();
  console.assert((styles?.size ?? 0) <= 1, `more styles than just color`);
  const color = styles?.get('color');
  return color;
}

export type Parsable = [string, string] | { lang: string; code: string };

export interface Parsed<T extends Char = Char, L extends Line = Line> {
  language: string;
  lines: L[];
  chars: T[];
}

export interface Tokenized<T extends Token = Token, L extends Line = Line> {
  language: string;
  lines: L[];
  tokens: T[];
}

export interface Line {
  tags: string[];
  number?: number;
}

export interface Text {
  classList: string[];
  sections: string[];
  color?: string;
  background?: string;
  provinance?: 'create' | 'retain' | 'delete';
}

export interface Char extends Text {
  char: string;
  token: [number, number];
}

export interface Token extends Text {
  token: string;
  prior?: [number, number];
  location: [number, number];
}

export function parse(language: string, code: string): Parsed<Char> {
  if (starryNight == null) {
    throw new Error('you must await ready() to initialize package');
  }
  const scope = starryNight.flagToScope(language);
  if (typeof scope !== 'string') {
    throw new Error(`language ${language} not found`);
  }
  const parsed = starryNight.highlight(code, scope);
  const converted = recurse(parsed);
  return markTree({
    language,
    lines: [],
    chars: converted,
  });
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
        sections: [],
      });
    }
  }
  return result;
}

const nextLineRegex = /^\/\/:[^\S\n]*next-line[^\S\n]+([^\n]+?)[^\S\n]*$/;
const thisLineRegex = /^\/\/:[^\S\n]*this-line[^\S\n]+([^\n]+?)[^\S\n]*$/;
const blockStartRegex = /^\/\/<<[^\S\n]*([^\n]+?)[^\S\n]*$/;
const blockEndRegex = /^\/\/>>[^\S\n]*$/;
const sectionStartRegex = /^\/\*<<[^\S\n]*([^\n]+?)[^\S\n]*\*\/$/;
const sectionEndRegex = /^\/\*>>[^\S\n]*\*\/$/;
export const tagRegex = /^\/\*<[^\S\r\n]*(.*?)[^\S\r\n]*>\*\/$/;

const specialTypes: [RegExp, string[]][] = [
  [nextLineRegex, ['nextLine', 'line']],
  [thisLineRegex, ['thisLine', 'line']],
  [blockStartRegex, ['blockStart', 'line']],
  [blockEndRegex, ['blockEnd', 'line']],
  [sectionStartRegex, ['sectionStart', 'span']],
  [sectionEndRegex, ['sectionEnd', 'span']],
  [tagRegex, ['tag', 'span']],
];
function getSpecialType(span: string) {
  for (const [regex, result] of specialTypes) {
    if (regex.test(span)) return result;
  }
  return [];
}

function* spans(chars: Char[]): Generator<[Char[], number], void, void> {
  let i = 0;
  while (i < chars.length) {
    const char = chars[i];
    console.assert(char.token[0] === 0, `token was not beginning of span`);
    yield [chars.slice(i, i + char.token[1]), i];
    i += char.token[1];
  }
}

function markTree(parsed: Parsed<Char>): Parsed<Char> {
  const chars = parsed.chars;
  const lineCount =
    1 +
    chars.reduce((prior, { char }) => {
      return prior + (char === '\n' ? 1 : 0);
    }, 0);
  const lines: { tags: string[] }[] = new Array(lineCount)
    .fill(1)
    .map(() => ({ tags: [] }));
  let ln = 0;
  const blocks = [];
  const sections = [];
  let sectionHold = null;
  const result: Char[] = [];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    if (char.token[0] === 0 && sectionHold != null) {
      sections.unshift(sectionHold);
      sectionHold = null;
    }

    result.push({
      ...char,
      sections: [...sections],
    });

    if (char.token[0] !== 0) {
      continue;
    }

    const span = getSpan(chars, i);
    if (char.char === '\n') {
      ln++;
      lines[ln].tags.push(...blocks);
    } else if (char.classList.length === 1 && char.classList[0] === 'pl-c') {
      if (nextLineRegex.test(span)) {
        const name = span.match(nextLineRegex)?.[1] as string;
        lines[ln + 1].tags.push(name);
      } else if (thisLineRegex.test(span)) {
        const name = span.match(thisLineRegex)?.[1] as string;
        lines[ln].tags.push(name);
      } else if (blockStartRegex.test(span)) {
        blocks.push(span.match(blockStartRegex)?.[1] as string);
      } else if (blockEndRegex.test(span)) {
        blocks.pop();
      } else if (sectionStartRegex.test(span)) {
        sectionHold = span.match(sectionStartRegex)?.[1] as string;
      } else if (sectionEndRegex.test(span)) {
        sections.shift();
      }
    }
  }
  return {
    ...parsed,
    lines,
    chars: result,
  };
}

/**
 * @internal
 * @param input - parsed or parsable variable
 * @returns parsed code
 */
export function ensureParsed(input: Parsed | Parsable): Parsed {
  if (Array.isArray(input)) {
    return parse(input[0], input[1]);
  } else if (typeof input === 'object' && 'code' in input) {
    return parse(input.lang, input.code);
  } else {
    return input as Parsed<Char>;
  }
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

export function getSpan(tree: Char[], at: number) {
  const [back, length] = tree[at].token;
  const start = at - back;
  const end = start + length;
  let result = '';
  for (let i = start; i < end; i++) {
    result += tree[i].char;
  }
  return result;
}

/**
 * Removes all code-fns tags.
 *
 * @param code - the parsed or parsable code to clean
 */
export function clean(code: Parsed<Char> | Parsable): Parsed<Char> {
  const parsed = ensureParsed(code);
  const result: Char[] = [];
  let lineNumber = 0;
  let finalNumber = 1;
  let lineSkip = false;
  const lines = [];
  for (const [span] of spans(parsed.chars)) {
    if (span.length === 1 && span[0].char === '\n') lineNumber++;
    if (lineSkip) {
      console.assert(
        span.length === 1 && span[0].char === '\n',
        `expected a new line`,
      );
      lineSkip = false;
      continue;
    } else if (span.length === 1 && span[0].char === '\n') {
      lines.push({
        ...parsed.lines[lineNumber],
        number: finalNumber,
      });
      finalNumber++;
    }
    console.assert(span[0].classList.length === 1, `multiple classes found`);
    const specialTypes = getSpecialType(
      span.reduce((text, { char }) => text + char, ''),
    );
    if (span[0].classList[0] !== 'pl-c' || specialTypes.length === 0) {
      result.push(...span);
    } else if (specialTypes.includes('line')) {
      lineSkip = true;
    }
  }
  lines.push({
    ...parsed.lines[lineNumber],
    number: finalNumber,
  });
  if (lineSkip) {
    lines.pop();
    console.assert(
      result[result.length - 1].char === '\n',
      `expected a new line`,
    );
    result.pop();
  }
  return {
    ...parsed,
    chars: result,
    lines,
  };
}
