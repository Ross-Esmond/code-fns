import { createStarryNight, all } from '@wooorm/starry-night';
import type { Root, RootContent } from 'hast';

export type Parsable = [string, string] | { lang: string; code: string };

export interface Parsed<T extends Char = Char> {
  language: string;
  chars: T[];
}

export interface Tokenized<T extends Token = Token> {
  language: string;
  tokens: T[];
}

export type section = [string, string?];

export interface Text {
  classList: string[];
  sections: section[];
  isSpecial?: boolean;
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

const starryNight = createStarryNight(all);

/**
 * Parse some code into a collection of styled characters given a language.
 * The parsed result may then be used in other functions to draw or transform the code.
 *
 * @param language - the language of the code, like `tsx` or `js`
 * @param code - the code to parse, like `() => true`
 * @returns an object containing a collection of characters with styling metadata
 *
 * @example
 * ```tsx
 * import {parse} from 'code-fns';
 * const parsed = await parse('tsx', '() => true');
 * // perform further actions with `parsed`
 * ```
 */
export async function parse(language: string, code: string): Promise<Parsed> {
  const sn = await starryNight;
  const scope = sn.flagToScope(language);
  if (typeof scope !== 'string') {
    throw new Error(`language ${language} not found`);
  }
  const parsed = sn.highlight(code, scope);
  const converted = recurse(parsed);
  return markTree({
    language,
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
/** @internal */
export const tagRegex = /^\/\*<[^\S\r\n]*(.*?)[^\S\r\n]*>\*\/$/;

const specialTypes: [RegExp, string[]][] = [
  [nextLineRegex, ['nextLine', 'line']],
  [thisLineRegex, ['thisLine']],
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

function markTree(parsed: Parsed<Char>): Parsed<Char> {
  const chars = parsed.chars;
  const sections = [];
  const result: Char[] = [];
  let isSpecial = false;
  let nextLineSection = null;
  let thisLineSections: section[] = [];
  let lineComment = false;
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const span = getSpan(chars, i);

    if (char.token[0] === 0) {
      const specialTypes = getSpecialType(span);
      isSpecial = specialTypes.length > 0;
      if (specialTypes.includes('line')) {
        lineComment = true;
      }
    }

    result.push({
      ...char,
      sections: [...sections, ...thisLineSections],
      isSpecial: isSpecial || lineComment,
    });

    if (char.token[0] !== 0) {
      continue;
    }

    if (char.char === '\n') {
      thisLineSections = nextLineSection ? [[nextLineSection]] : [];
      nextLineSection = null;
      lineComment = false;
    } else if (char.classList.length === 1 && char.classList[0] === 'pl-c') {
      if (nextLineRegex.test(span)) {
        nextLineSection = span.match(nextLineRegex)?.[1] as string;
      } else if (thisLineRegex.test(span)) {
        const name = span.match(thisLineRegex)?.[1] as string;
        thisLineSections.push([name]);
        for (let j = i - 1; 0 <= j; j--) {
          if (result[j].char === '\n') break;
          result[j].sections.push([name]);
        }
      } else if (blockStartRegex.test(span)) {
        sections.unshift([span.match(blockStartRegex)?.[1]] as [string]);
      } else if (sectionStartRegex.test(span)) {
        sections.unshift([span.match(sectionStartRegex)?.[1]] as [string]);
      } else if (sectionEndRegex.test(span) || blockEndRegex.test(span)) {
        sections.shift();
      }
    }
  }
  return {
    ...parsed,
    chars: result,
  };
}

/**
 * Sets up an alternative chunk of code for a particular tag or section of code.
 * You must run `addAlternative` on the result of a `parse` but before you `process` the code.
 *
 * @param code - the original code in which to add an alternative
 * @param tag - the target tag to replace with code
 * @param name - the name to identify this alternative code
 * @param replacement - the code which will replace the tag
 * @returns the new parsed code with the alternative built in
 *
 * @example
 * Example using a section block: `/*<<tagname*​/ code /*>>*​/`.
 * ```tsx
 * import {parse, addAlternative, process, toString} from 'code-fns';
 * const parsed = await parse('tsx', '() => /*<<val*​/null/*>>*​/');
 * const alt = await addAlternative(parsed, 'val', 'always-true', 'true');
 * const processed = process(alt, {val: 'always-true'});
 * console.log(toString(processed));
 * // `() => true`
 * ```
 */
export async function addAlternative(
  code: Parsed,
  tag: string,
  name: string,
  replacement: string,
): Promise<Parsed> {
  const { language, chars } = code;
  const replacements: [number, number][] = [];
  let final = '';
  chars.forEach((char, at) => {
    if (char.token[0] !== 0) return;
    const span = getSpan(chars, at);
    if (char.classList[0] === 'pl-c' && tagRegex.test(span)) {
      const [, tagName] = span.match(tagRegex) as [string, string];
      if (tagName === tag) {
        final += replacement;
        if (replacement !== '') replacements.push([at, replacement.length]);
      } else {
        final += span;
      }
    } else {
      final += span;
    }
  });
  const reparsed = await parse(language, final);
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
        sections: inReplacement
          ? [[tag, name], ...char.sections]
          : char.sections,
      };
    }),
  };
}

/**
 * Converts parsed or processed code to a string.
 *
 * @param code - the result of parse or process
 * @returns a plain string of the code, with any code changes
 *
 * @example
 * Using `toString` right after parsing returns the original code.
 * ```tsx
 * import {parse, toString} from 'code-fns';
 * const parsed = await parse('ts', '() => true');
 * console.log(toString(parsed));
 * // `() => true`
 * ```
 * @example
 * You may use `addAlternative` and `process` to alter the code.
 * ```tsx
 * import {parse, addAlternative, process, toString} from 'code-fns';
 * const parsed = await parse('ts', '() => /*<<result*​/null/*>>*​/');
 * console.log(toString(parsed));
 * // `() => /*<<result*​/null/*>>*​/`
 * const withTrue = await addAlternative(parsed, 'result', 'always-true', 'true');
 * const withBoth = await addAlternative(withTrue, 'result', 'always-false', 'false');
 * console.log(toString(process(withBoth, {result: 'always-true'})));
 * // `() => true`
 * console.log(toString(process(withBoth, {result: 'always-false'})));
 * // `() => false`
 * ```
 */
export function toString(code: Parsed): string {
  const result: string[] = [];
  code.chars.forEach(({ char }) => result.push(char));
  return result.join('');
}

/**
 * @internal
 */
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
 * Finalize code by removing special tags and selecting alternatives.
 * `process` runs on the result of `parse`.
 * Once code is run through `parse` it may be processed at any time.
 *
 * @param parsed - the parsed code
 * @param alts - a record of tags and alternatives to keep or select
 * @returns new code without special tags and unused alternatives
 *
 * @example
 * Using `process` to remove special tags.
 * ```tsx
 * import {parse, process, toString} from 'code-fns';
 * const parsed = await parse('tsx', (/*<param>*​/) => true);
 * const processed = process(parsed);
 * // by default, process removes tags
 * console.log(toString(processed));
 * // `() => true`
 * ```
 * @example
 * Using `process` to replace special tags.
 * ```tsx
 * import {parse, process, toString} from 'code-fns';
 * const parsed = await parse('tsx', (/*<param>*​/) => true);
 * const processed = process(parsed, {param: 'arg: any'});
 * // by default, process removes tags
 * console.log(toString(processed));
 * // `(arg: any) => true`
 * ```
 */
export function process(
  parsed: Parsed,
  alts: Record<string, boolean | string> = {},
): Parsed {
  const chars = parsed.chars.filter((char) => {
    if (char.isSpecial) return false;
    for (const section of char.sections) {
      if (section.length === 1) {
        if (section[0] in alts && alts[section[0]] !== true) return false;
      } else if (section.length === 2) {
        const [tag, alt] = section;
        if (!(tag in alts) || alts[tag] !== alt) return false;
      } else {
        console.error('unfamiliar section');
      }
    }
    return true;
  });
  return {
    ...parsed,
    chars,
  };
}
