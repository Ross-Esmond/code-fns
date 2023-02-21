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
   * The color for a variable
   * ```ts
   * const what; // "what" is a variable
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
   * The colors for a regular expressions
   */
  regexp?: {
    /**
     * The colors for the whole Regular Expression literal
     * ```ts
     * /regex/g
     * ```
     */
    text?: string;
    /**
     * The colors for a Regular Expression's content.
     * ```ts
     * /regex/g // "regex" is the content
     * ```
     */
    content?: string;
    /**
     * The colors for a Regular Expression's brackets.
     * ```ts
     * /regex/g // "/" are the brackets
     * ```
     */
    brackets?: string;
    /**
     * The colors for a Regular Expression's falgs.
     * ```ts
     * /regex/g // "g" is the only flag
     * ```
     */
    flags?: string;
  };
  /**
   * @deprecated Use {@link regexp} instead
   * The colors for a Regular Expression's content.
   * ```ts
   * /regex/g // "regex" is the content
   * ```
   */
  regexpContent?: Colors;
  /**
   * @deprecated Use {@link number} or {@link boolean} instead
   * The colors for a literal value, like "true" or "5".
   * ```ts
   * true
   * ```
   */
  literal?: Colors;
  /**
   * The colors for a literal number
   * ```ts
   * 5
   * ```
   */
  number?: Colors;
  /**
   * The colors for a literal boolean
   * ```ts
   * true
   * ```
   */
  boolean?: Colors;
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
