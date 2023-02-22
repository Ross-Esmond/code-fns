import {
  getHighlighter,
  Highlighter,
  IThemedToken,
  setCDN,
  Lang,
  Theme,
} from 'shiki';
import type { CodeStyle } from './style';

setCDN('https://esm.sh/shiki@latest/');

let highlighter: Highlighter | null = null;
export async function ready(options?: {
  languages?: Lang[];
  themes?: Theme[];
}) {
  if (highlighter == null) {
    highlighter = await getHighlighter({
      themes: ['github-dark'].concat(options?.themes ?? []),
      langs: options?.languages ?? [],
    });
  } else {
    for (const language of options?.languages ?? []) {
      await highlighter.loadLanguage(language);
    }
    for (const theme of options?.themes ?? []) {
      await highlighter.loadTheme(theme);
    }
  }
}

export interface CodeTree {
  language: string;
  spans: string[];
  nodes: Code[];
}

export type Code = CodeTree | string;

export type TaggedFunction = (
  code: TemplateStringsArray,
  ...rest: Code[]
) => CodeTree;
export type LanguageDictionary = Record<string, TaggedFunction>;
const handler = {
  get(_: LanguageDictionary, language: string): TaggedFunction {
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

export type Location = [number, number];

export interface Token {
  code: string;
  color: string;
}

export interface MorphToken extends Token {
  morph: 'create' | 'delete' | 'retain';
  from: Location | null;
  to: Location | null;
}

export function parse(
  code: CodeTree,
  options?: { codeStyle?: CodeStyle; theme?: Theme },
): Token[] {
  const raw = integrate(reindent(code));
  if (highlighter == null) {
    throw new Error('you must await ready() before parsing code');
  }
  const parsed = highlighter.codeToThemedTokens(
    raw,
    code.language,
    options?.theme ?? 'github-dark',
  );
  return parsed
    .flatMap((line) =>
      line.concat([
        { content: '\n', explanation: [{ content: '\n', scopes: [] }] },
      ]),
    )
    .flatMap((token) => maybeReplace(token, options?.codeStyle ?? {}))
    .map((themed) => ({
      code: themed.content,
      color: themed.color || '#C9D1D9',
    }))
    .slice(0, -1);
}

function getColor(
  scopes: Array<{ scopeName: string }>,
  codeStyle: CodeStyle,
  fallback = '#C9D1D9',
): string {
  function hasScope(target: string) {
    return scopes.some((scope) => scope.scopeName.startsWith(target));
  }
  const isStringPunctuation = hasScope('punctuation.definition.string');
  const isRegex = hasScope('string.regexp');
  const isKeyword = hasScope('keyword');
  const isString = hasScope('string');
  const isVaraible = hasScope('variable');
  const isParameter = hasScope('variable.parameter');
  const isComment = hasScope('comment');
  const isNumber = hasScope('constant.numeric');
  const isBoolean = hasScope('constant.language.boolean');
  const isStorageType = hasScope('storage.type');
  const isEntityName = hasScope('entity.name');
  if (isRegex && !isStringPunctuation && !isKeyword) {
    return (
      codeStyle.regexpContent?.text ??
      codeStyle.regexp?.content ??
      codeStyle.regexp?.text ??
      fallback
    );
  } else if (isRegex && isStringPunctuation) {
    return codeStyle.regexp?.brackets ?? codeStyle.regexp?.text ?? fallback;
  } else if (isRegex && isKeyword) {
    return codeStyle.regexp?.flags ?? codeStyle.regexp?.text ?? fallback;
  } else if (isStringPunctuation) {
    return codeStyle.stringPunctuation?.text ?? fallback;
  } else if (isString) {
    return codeStyle.stringContent?.text ?? fallback;
  } else if (isParameter) {
    return codeStyle.parameter?.text ?? fallback;
  } else if (isVaraible) {
    return codeStyle.variable?.text ?? fallback;
  } else if (isComment) {
    return codeStyle.comment?.text ?? fallback;
  } else if (isNumber) {
    return codeStyle.number?.text ?? codeStyle.literal?.text ?? fallback;
  } else if (isBoolean) {
    return codeStyle.boolean?.text ?? codeStyle.literal?.text ?? fallback;
  } else if (isStorageType) {
    return codeStyle.keyword?.text ?? fallback;
  } else if (isEntityName) {
    return codeStyle.entityName?.text ?? fallback;
  } else {
    return fallback;
  }
}

function maybeReplace(
  node: IThemedToken,
  codeStyle: CodeStyle,
): IThemedToken[] {
  const result: IThemedToken[] = [];
  for (const { content, scopes } of node.explanation ?? []) {
    result.push({ content, color: getColor(scopes, codeStyle, node.color) });
  }
  const aggregated: IThemedToken[] = [];
  for (const { content, color } of result) {
    const last = aggregated.at(-1);
    if (last == null || last.color !== color) {
      aggregated.push({ content, color });
    } else {
      last.content += content;
    }
  }
  return aggregated;
}

export function toString(tokens: Token[]): string {
  return tokens.map((token) => token.code).join('');
}

function reindent(code: string, indent?: number): string;
function reindent(code: CodeTree, indent?: number): CodeTree;
function reindent(code: Code, indent?: number): Code;
function reindent(code: Code, indent = 0): Code {
  if (typeof code === 'string') {
    if (code.at(0) !== '\n') {
      return ' '.repeat(indent) + code;
    }

    const regex = /^ +/gm;
    const matches = code.matchAll(regex);
    let min = Infinity;
    for (const match of matches) min = Math.min(min, match[0].length);
    const undent = new RegExp(`^ {${min}}`, 'gm');
    const result = code.substring(1).replace(undent, ' '.repeat(indent));
    return result;
  }

  if (code.spans.at(0)?.at(0) !== '\n') return code;

  const regex = /\n */g;
  const matches = code.spans.flatMap((span) => [...span.matchAll(regex)]);
  let min = Infinity;
  for (const [match] of matches) min = Math.min(min, match.length - 1);
  const undentRegex = new RegExp(`\n {${min}}`, 'g');
  const spans = code.spans.map((span) =>
    span.replace(undentRegex, '\n' + ' '.repeat(indent)),
  );
  spans[0] = spans[0].substring(1);

  let index = 0;
  const nodes = [];
  for (const node of code.nodes) {
    const before = spans[index];
    const preindentRegex = /\n *$/;
    const indentation = before.match(preindentRegex);
    if (indentation != null) {
      spans[index] = spans[index].replace(preindentRegex, '\n');
      nodes.push(reindent(node, indentation[0].length - 1));
    } else {
      nodes.push(node);
    }
    index++;
  }

  return {
    language: code.language,
    spans,
    nodes,
  };
}

function integrate(code: Code): string {
  if (typeof code === 'string') return code;

  return String.raw(
    { raw: code.spans },
    ...code.nodes.map((n) => integrate(n)),
  );
}

function isLevelEquivilant(one: Code | null, two: Code | null): boolean {
  if (one === null || two === null) return false;
  if (
    (typeof one === 'string' && typeof two !== 'string') ||
    (typeof one !== 'string' && typeof two === 'string')
  ) {
    return false;
  }
  if (typeof one === 'string' && typeof two === 'string') {
    return one === two;
  }
  if (typeof one !== 'string' && typeof two !== 'string') {
    if (one.spans.length !== two.spans.length) return false;

    return one.spans.every((span, i) => span === two.spans[i]);
  }
  throw new Error('Could not determine equivilance of nodes');
}

function chars(tokens: Token[]): Token[] {
  return tokens.flatMap(({ code, color }) => {
    return code.split('').map((c) => ({
      code: c,
      color,
    }));
  });
}

function tokens(chars: MorphToken[]): MorphToken[] {
  const result = [];
  let token = null;
  for (const char of chars) {
    if (token == null) {
      token = char;
    } else {
      if (char.code === '\n') {
        result.push(token);
        token = null;
      } else if (token.color === char.color && token.morph === char.morph) {
        token.code += char.code;
      } else {
        result.push(token);
        token = char;
      }
    }
  }
  if (token != null) result.push(token);
  return result;
}

export function diff(
  start: CodeTree,
  end: CodeTree,
  options?: { codeStyle?: CodeStyle },
) {
  start = reindent(start);
  end = reindent(end);
  const startParsed = chars(parse(start, options));
  const endParsed = chars(parse(end, options));
  let index = 0;
  let endex = 0;
  const result: {
    code: string;
    color: string;
    morph: 'retain' | 'delete' | 'create';
  }[] = [];
  function recurse(one: Code | null, two: Code | null) {
    const progress = (l: string, r?: string) => {
      if (r == null) r = l;
      const startIndex = index;
      while (index < startIndex + l.length && index < startParsed.length) {
        result.push({
          code: startParsed[index].code,
          color: startParsed[index].color,
          morph: l === r ? 'retain' : 'delete',
        });
        index++;
      }
      const endIndex = endex;
      while (
        endex < endIndex + r.length &&
        two !== '' &&
        endex < endParsed.length
      ) {
        if (r !== l) {
          result.push({
            code: endParsed[endex].code,
            color: endParsed[endex].color,
            morph: 'create',
          });
        }
        endex++;
      }
    };
    if (isLevelEquivilant(one, two)) {
      if (one == null || two == null) {
        throw new Error('equivilant nodes should not be null');
      }
      if (typeof one === 'string') {
        progress(one);
      } else {
        if (typeof two === 'string') throw new Error();
        for (let n = 0; n < one.nodes.length; n++) {
          progress(one.spans[n]);
          recurse(one.nodes[n], two.nodes[n]);
        }
        progress(one.spans.at(-1) ?? '');
      }
    } else {
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
        progress(one.spans.at(-1) ?? '', '');
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
  let [sat, sln, eat, eln] = [0, 0, 0, 0];
  const positioned = result.map(({ code, color, morph }) => {
    const value: MorphToken = {
      code,
      color,
      morph,
      from: morph === 'create' ? null : [sat, sln],
      to: morph === 'delete' ? null : [eat, eln],
    };
    if (code === '\n') {
      if (morph !== 'create') {
        sat = 0;
        sln++;
      }
      if (morph !== 'delete') {
        eat = 0;
        eln++;
      }
    } else {
      if (morph !== 'create') sat++;
      if (morph !== 'delete') eat++;
    }
    return value;
  });
  const tokenized = tokens(positioned);

  return tokenized.filter(({ code }) => {
    return code.length !== 0 && !/^ +$/.test(code);
  });
}
