import {createStarryNight, all, Root} from '@wooorm/starry-night'
import type {RootContent} from 'hast'
import styles from 'github-markdown-css/github-markdown-dark.css'
import css, {Stylesheet, Rule, Declaration} from 'css'

const rules = new Map();

const scopePrefix = '.markdown-body '
const prefix = '.pl-'
for (const rule of walkRules(css.parse(styles))) {
  if (rule.selectors) {
    const selectors = rule.selectors
      .filter((d: string) => d.startsWith(scopePrefix))
      .map((d: string) => d.slice(scopePrefix.length))
      .filter((d: string) => d.startsWith(prefix))

    if (selectors.length > 0) {
      const settings = new Map();
      rule.declarations?.forEach((declaration: Declaration) => {
        settings.set(declaration.property, declaration.value);
      })
      selectors.forEach((selector: string) => {
        rules.set(selector, settings)
      })
    }
  }
}

const starryNightPromise = createStarryNight(all);

function last (arr: any[]) {
  return arr[arr.length - 1];
}

export class RenderList {
  constructor(
    readonly lines: RenderLine[],
    readonly language: string,
  ) {
  }
}
export class RenderLine {
  constructor(
    readonly tokens: RenderToken[],
    readonly tags: string[] = [],
  ) {
  }
}
export class RenderToken {
  public readonly color?: string;
  public readonly type?: string;
  public readonly tag?: string;

  constructor(
    readonly text: string,
    options?: {
      color?: string,
      type?: string,
      tag?: string,
    },
  ) {
    this.color = options?.color ?? '';
    this.type = options?.type;
    this.tag = options?.tag;
  }
}

export async function parse(code: string, language: string) {
  const starryNight = await starryNightPromise;
  const scope = starryNight.flagToScope(language);
  if (typeof scope !== 'string') throw new Error(`language ${language} not found`);
  return convert(starryNight.highlight(code, scope), language)
}

const classType = new Map([
  ['pl-c', 'comment'],
  ['pl-k', 'keyword'],
  ['pl-en', 'entity.name'],
  ['pl-ent', 'entity.name.tag'],
  ['pl-v', 'variable'],
  ['pl-c1', 'constant'],
  ['pl-e', 'entity'],
  ['pl-pse', 'punctuation.section.embedded'],
  ['pl-smi', 'storage.modifier.import'],
  ['pl-s', 'storage'],
  ['pl-s1', 'string'],
  ['pl-kos', 'keyword.other.special-method'],
  ['pl-pds', 'punctuation.definition.string'],
  ['pl-sr', 'string.regexp'],
]);

const tagRegex = /^\/\*<[^\S\r\n]*(.*?)[^\S\r\n]*>\*\/$/

function convert(node: Root, language: string): RenderList {
  const converted = _convert(node, '', []);

  return new RenderList(
    converted.map(line => {
      return new RenderLine(
        line
        .filter(([text]) => text !== '')
        .map(([text, className]) => {
          const styles = rules.get(`.${className}`);
          const spanColor = styles?.has('color') ? styles.get('color') : null;
          const type = classType.get(className) ?? '';
          let tag: string | undefined;
          if (type === 'comment' && tagRegex.test(text)) {
            [, tag] = text.match(tagRegex)
          }
          return new RenderToken(
            text, {
              color: spanColor || undefined,
              type,
              tag,
            });
        }));
    }),
    language,
  );
}

function _convert(
  node: Root | RootContent,
  parentClass: string,
  list: [string, string][][] = []
): [string, string][][] {
  switch (node.type) {
    case "element":
      console.assert(node.properties, 'element node did not have properties')
      console.assert(Array.isArray(node?.properties?.className), 'className was not an array');
      const classList = node?.properties?.className as string[];
      console.assert(classList.length === 1, 'properties too long');
      const className = classList[0] as string;
      console.assert(classType.has(className), `className ${className} missing`);
      node.children?.forEach(child => _convert(child, className, list));
      break;
    case "root":
      list.push([]);
      node.children?.forEach(child => _convert(child, '', list));
      break;
    case "text":
      console.assert(node.value, 'text node did not have value');
      const text = node.value as string;
      const [first, ...rest] = text.split('\n');
      last(list).push([first, parentClass]);
      for (const text of rest) {
        list.push([]);
        last(list).push([text, parentClass]);
      }
      break;
  }
  return list
}

function* walkRules(ast: Stylesheet): Generator<Rule, void, void> {
  if (ast.type === 'stylesheet' && 'stylesheet' in ast && ast.stylesheet) {
    for (const rule of ast.stylesheet.rules) {
      if (rule.type === 'rule') {
        yield rule
      } else {
        yield* walkRules(rule)
      }
    }
  }
}
