export type Colors = {
  text: string;
};

export interface CodeStyle {
  /**
   * The colors for a string's contents.
   * ```ts
   * `some string` // "some string" is the content; the `` are not.
   * ```
   */
  stringContent?: Colors;
  /**
   * The colors for a strings quotation marks.
   * ```ts
   * `some string` // the `` are the punctuation
   * ```
   */
  stringPunctuation?: Colors;
  /**
   * The color for an erroneous token, like a mismatched bracket.
   * ```ts
   * (5 + 3)) // <== extra token
   * ```
   */
  variable?: Colors;
  /**
   * The colors for a parameter.
   * ```ts
   * function (param) {} // "param" is the parameter
   * ```
   */
  parameter?: Colors;
  /**
   * The colors for a code comment.
   * ```ts
   * // a comment
   * ```
   */
  comment?: Colors;
  /**
   * The colors for a Regular Expression's content.
   * ```ts
   * /regex/g // "regex" is the content
   * ```
   */
  regexpContent?: Colors;
  /**
   * The colors for a literal value, like "true" or "5".
   * ```ts
   * true
   * ```
   */
  literal?: Colors;
  /**
   * The colors for a language keyword, like `function`.
   */
  keyword?: Colors;
  /**
   * The colors for an entity name, like a function identifier.
   * ```ts
   * myFunc(); // "myFunc" is an entity name
   * ```
   */
  entityName?: Colors;
}
