import {
  getSpan,
  tagRegex,
  parse,
  Parsed,
  Parsable,
  Token,
  ensureParsed,
  Char,
  Tokenized,
} from './code';
import { color } from './color';

export function substitute(
  code: Parsed<Char> | Parsable,
  subs: Record<string, string>,
): Parsed<Char> {
  const parsed = color(ensureParsed(code));
  const language = parsed.language;
  const tree = parsed.chars;
  const replacements: [number, number][] = [];
  let final = '';
  tree.forEach((char, at) => {
    if (char.token[0] !== 0) return;
    const span = getSpan(tree, at);
    if (char.classList[0] === 'pl-c' && tagRegex.test(span)) {
      const [, name] = span.match(tagRegex) as [string, string];
      if (name in subs) {
        const rep = subs[name];
        final += rep;
        if (rep !== '') replacements.push([at, rep.length]);
      } else {
        final += span;
      }
    } else {
      final += span;
    }
  });
  const reparsed = color(parse(language, final));
  let [r, ri] = [0, 0];
  let inReplacement = false;
  return {
    language,
    lines: [],
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
        provinance: inReplacement ? 'create' : 'retain',
      };
    }),
  };
}

export function transform(
  code: Parsed | Parsable,
  start: Record<string, string>,
  final: Record<string, string>,
): Parsed {
  const parsed = ensureParsed(code);
  const before = substitute(parsed, start);
  const after = substitute(parsed, final);
  let [bat] = [0];
  let [aat] = [0];
  const chars: Char[] = [];
  while (bat < before.chars.length || aat < after.chars.length) {
    const bchar = before.chars[bat] ?? null;
    const achar = after.chars[aat] ?? null;
    if (bchar?.provinance === 'retain' && achar?.provinance === 'retain') {
      chars.push({
        ...achar,
        provinance: 'retain',
      });
      bat++;
      aat++;
    } else if (bchar?.provinance === 'create') {
      chars.push({
        ...bchar,
        provinance: 'delete',
      });
      bat++;
    } else if (achar?.provinance === 'create') {
      chars.push({
        ...achar,
        provinance: 'create',
      });
      aat++;
    }
  }

  return {
    ...parsed,
    chars,
  };
}

export function transition(
  code: Parsed<Char> | Parsable,
  start: Record<string, string>,
  final: Record<string, string>,
): Tokenized {
  const tree = ensureParsed(code);
  const colored = color(tree);
  const transformed = transform(colored, start, final);
  const tokenized = tokenize(transformed);
  let [dln, dat] = [0, 0];
  let [cln, cat] = [0, 0];
  const tokens = tokenized.tokens.map((token): Token => {
    if (token.token === '\n') {
      if (token.provinance === 'retain' || token.provinance === 'create') {
        cln++;
        cat = 0;
      }
      if (token.provinance === 'retain' || token.provinance === 'delete') {
        dln++;
        dat = 0;
      }
      return token;
    } else {
      if (token.provinance === 'delete') {
        dat += token.token.length;
        return {
          ...token,
          location: [dln, dat - token.token.length],
        };
      } else if (token.provinance === 'create') {
        cat += token.token.length;
        return {
          ...token,
          location: [cln, cat - token.token.length],
        };
      } else if (token.provinance === 'retain') {
        dat += token.token.length;
        cat += token.token.length;
        return {
          ...token,
          prior: [dln, dat - token.token.length],
          location: [cln, cat - token.token.length],
        };
      }
    }
    throw new Error('no path found');
  });
  // TODO correct lines
  return {
    ...tokenized,
    tokens,
  };
}

export function tokenize(code: Parsed): Tokenized {
  const chars = code.chars;
  let lastFgColor: string | undefined | symbol = Symbol();
  let lastBgColor: string | undefined | symbol = Symbol();
  let lastProvinance: string | undefined | symbol = Symbol();
  let [ln, at] = [0, 0];
  const tokens: Token[] = [];
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const color = char.color;
    const background = char.background;
    const provinance = char.provinance;
    if (char.char === '\n') {
      tokens.push({
        classList: char.classList,
        sections: char.sections,
        token: char.char,
        location: [ln, at],
        color,
        background,
        provinance,
      });
      lastFgColor = Symbol();
      lastBgColor = Symbol();
      lastProvinance = Symbol();
      ln++;
      at = 0;
    } else {
      if (
        color === lastFgColor &&
        background === lastBgColor &&
        provinance === lastProvinance
      ) {
        tokens[tokens.length - 1].token += char.char;
        at++;
      } else {
        tokens.push({
          classList: char.classList,
          sections: char.sections,
          token: char.char,
          location: [ln, at],
          color,
          background,
          provinance,
        });
        lastFgColor = color;
        lastBgColor = background;
        lastProvinance = provinance;
        at++;
      }
    }
  }
  return {
    language: code.language,
    lines: code.lines,
    tokens,
  };
}
