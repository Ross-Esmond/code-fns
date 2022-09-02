import {
  Parsed,
  ColorCoded,
  Char,
  Parsable,
  ensureParsed,
  getColor,
  Line,
  Tokenized,
  Token,
} from './code';

export enum Undertone {
  Grey = '#212121',
  Plum = '#3c2126',
  Purple = '#2a2133',
  Blue = '#011c39',
  Teal = '#043132',
  Green = '#172808',
  Brown = '#2c1608',
}

function getBackground(
  char: Char,
  highlight: Record<string, string>,
): string | undefined {
  const relevantSection = char.sections.find((s) => s in highlight);
  return relevantSection !== undefined ? highlight[relevantSection] : undefined;
}

export function color(
  code: Parsed<Char> | Parsable,
  highlight: Record<string, string> = {},
): Parsed<Char & ColorCoded, Line & ColorCoded> {
  const parsed = ensureParsed(code);
  const chars = parsed.chars.map((char) => ({
    ...char,
    color: getColor(char.classList),
    background: getBackground(char, highlight),
  }));
  const lines = parsed.lines.map((line, i) => {
    const { tags } = line;
    const relevantTag = tags.find((tag) => tag in highlight);
    const background = relevantTag ? highlight[relevantTag] : undefined;
    return {
      ...line,
      number: i + 1,
      background,
    };
  });
  return {
    ...parsed,
    chars,
    lines,
  };
}

export function tokenize<L extends Line>(
  code: Parsed<Char & ColorCoded, L>,
): Tokenized<Token & ColorCoded, L> {
  const chars = code.chars;
  let lastFgColor: string | undefined | symbol = Symbol();
  let lastBgColor: string | undefined | symbol = Symbol();
  let [ln, at] = [0, 0];
  const tokens: (Token & ColorCoded)[] = [];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const color = char.color;
    const background = char.background;
    if (char.char === '\n') {
      lastFgColor = Symbol();
      lastBgColor = Symbol();
      ln++;
      at = 0;
    } else if (color === lastFgColor && background === lastBgColor) {
      tokens[tokens.length - 1].token += char.char;
      at++;
    } else {
      tokens.push({
        token: char.char,
        location: [ln, at],
        color,
        background,
      });
      at++;
    }
    lastFgColor = color;
    lastBgColor = background;
  }
  return {
    language: code.language,
    lines: code.lines,
    tokens,
  };
}
