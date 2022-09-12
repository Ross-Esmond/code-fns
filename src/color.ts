import { Parsed, Char, Parsable, ensureParsed, getColor } from './code';

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
  const [relevantSection] = char.sections.find(([s]) => s in highlight) ?? [];
  return relevantSection !== undefined ? highlight[relevantSection] : undefined;
}

export function color(
  code: Parsed<Char> | Parsable,
  highlight: Record<string, string> = {},
): Parsed {
  const parsed = ensureParsed(code);
  const chars = parsed.chars.map((char) => ({
    ...char,
    color: getColor(char.classList),
    background: getBackground(char, highlight),
  }));
  return {
    ...parsed,
    chars,
  };
}
