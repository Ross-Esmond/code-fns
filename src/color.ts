import { Parsed, Char } from './code';
import style from './dark-style.json';

const rules = new Map(
  Object.entries(style).map(([k, v]) => [k, new Map(Object.entries(v))]),
);

function getColor(classList: string[]): string | undefined {
  console.assert(classList.length <= 1, `classList too long`);
  const styles =
    classList.length === 1 ? rules.get(`.${classList[0]}`) : new Map();
  console.assert((styles?.size ?? 0) <= 1, `more styles than just color`);
  const color = styles?.get('color');
  return color;
}

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

/**
 * @internal
 */
export function color(
  code: Parsed,
  highlight: Record<string, string> = {},
): Parsed {
  const chars = code.chars.map((char) => ({
    ...char,
    color: getColor(char.classList),
    background: getBackground(char, highlight),
  }));
  return {
    ...code,
    chars,
  };
}
