import { createStarryNight, all } from '@wooorm/starry-night';
import { getColor } from './color';
import type { RootContent } from 'hast';

const starryNight = createStarryNight(all);

interface CodeTree {
  language: string;
  spans: string[];
  nodes: Code[];
}

type Code = CodeTree | string;

type TaggedFunction = (
  code: TemplateStringsArray,
  ...rest: string[]
) => CodeTree;
type LanguageDictionary = Record<string, TaggedFunction>;
const handler = {
  get(_: null, language: string): TaggedFunction {
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

export async function highlight(code: CodeTree) {
  const raw = integrate(code);
  const sn = await starryNight;
  const scope = sn.flagToScope(code.language);
  if (typeof scope !== 'string') {
    throw new Error(`language ${code.language} not found`);
  }
  const parsed = sn.highlight(raw, scope);
  return parsed.children
    .map(colorRecurse)
    .map((i) => (i.length === 1 ? i[0] : i));
}

function colorRecurse(parsed: RootContent): (string | [string, string])[] {
  if (parsed.type === 'text') {
    return [parsed.value];
  } else if (parsed.type === 'element') {
    const className = parsed.properties?.className;
    const color = getColor((className ?? []) as string[]);
    const children = parsed.children.map(colorRecurse);
    const result = [];
    const emit = () => {
      if (temp !== '') {
        if (color != null) {
          result.push([temp, color]);
        } else {
          result.push(temp);
        }
        temp = '';
      }
    };
    let temp = '';
    for (const child of children) {
      for (const item of child) {
        if (typeof item === 'string') {
          temp += item;
        } else {
          emit();
          result.push(item);
        }
      }
      emit();
    }
    emit();
    return result;
  } else {
    throw new Error();
  }
}

function integrate(code: Code) {
  if (typeof code === 'string') return code;

  return String.raw(
    { raw: code.spans },
    ...code.nodes.map((n) => integrate(n)),
  );
}
