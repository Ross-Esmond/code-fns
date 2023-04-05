export type Colors = {
  text: string;
};

export type StyleOption =
  | 'fallback'
  | 'keyword'
  | 'atom'
  | 'number'
  | 'def'
  | 'variable'
  | 'punctuation'
  | 'property'
  | 'operator'
  | 'variable-2'
  | 'variable-3'
  | 'type'
  | 'comment'
  | 'string'
  | 'string-2'
  | 'meta'
  | 'qualifier'
  | 'builtin'
  | 'bracket'
  | 'tag'
  | 'attribute'
  | 'hr'
  | 'link';

export function getFromCodeStyle(
  style: CodeStyle | null | undefined,
  option: StyleOption,
): Colors | null {
  if (style == null) return null;
  if (option === 'fallback') {
    return style.fallback ?? null;
  } else if (option === 'keyword') {
    return style.keyword ?? null;
  } else if (option === 'atom') {
    return style.atom ?? null;
  } else if (option === 'number') {
    return style.number ?? null;
  } else if (option === 'def') {
    return style.entityName ?? null;
  } else if (option === 'variable') {
    return style.variable ?? null;
  } else if (option === 'punctuation') {
    return null;
  } else if (option === 'property') {
    return null;
  } else if (option === 'operator') {
    return style.operator ?? null;
  } else if (option === 'variable-2') {
    return null;
  } else if (option === 'variable-3') {
    return null;
  } else if (option === 'type') {
    return null;
  } else if (option === 'comment') {
    return style.comment ?? null;
  } else if (option === 'string') {
    return style.string ?? null;
  } else if (option === 'string-2') {
    return style.regexp ?? null;
  } else if (option === 'meta') {
    return null;
  } else if (option === 'qualifier') {
    return null;
  } else if (option === 'builtin') {
    return null;
  } else if (option === 'bracket') {
    return null;
  } else if (option === 'tag') {
    return null;
  } else if (option === 'attribute') {
    return null;
  } else if (option === 'hr') {
    return null;
  } else if (option === 'link') {
    return null;
  }
  throw new Error(`option ${option} not found`);
}

export interface CodeStyle {
  /**
   * The colors for any characters not covered by any other option.
   * ```ts
   * let a = 5; // both "=" and "5" will receive the `base` color
   * ```
   */
  fallback?: Colors;
  /**
   * The colors for a language keyword, like `function`.
   */
  keyword?: Colors;
  /**
   * The colors for a literal value, like "true" or "null".
   * ```ts
   * true
   * ```
   */
  atom?: Colors;
  /**
   * The colors for a number literal: "5".
   */
  number?: Colors;
  /**
   * The colors for an entity name.
   * ```ts
   * let foo = 5; // "foo" is the entity's name
   * ```
   */
  entityName?: Colors;
  /**
   * The colors for a string.
   * ```ts
   * 'some string'
   * ```
   */
  string?: Colors;
  /**
   * The color for a variable
   * ```ts
   * const what; // "what" is a variable
   * ```
   */
  variable?: Colors;
  /**
   * The colors for a code comment.
   * ```ts
   * // a comment
   * ```
   */
  comment?: Colors;
  /**
   * The colors for a regular expressions.
   */
  regexp?: Colors;
  /**
   * The colors for an operator.
   * ```ts
   * () => null // "=>" is an operator
   * ```
   */
  operator?: Colors;
}
