import {createStarryNight, all, Root} from '@wooorm/starry-night'
import type {RootContent} from 'hast'
import styles from 'github-markdown-css/github-markdown-dark.css'
import css, {Stylesheet, Rule, Declaration} from 'css'
import {diff} from 'deep-diff'

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

export type RenderList = [string, string?][][];

export async function parse(code: string, language: string) {
  const starryNight = await starryNightPromise;
  const scope = starryNight.flagToScope(language);
  if (typeof scope !== 'string') throw new Error(`language ${language} not found`);
  return convert(starryNight.highlight(code, scope))
    .map(line => line.filter(token => token[0] !== ''))
}

function convert(node: Root): RenderList {
  return _convert(node, null, []);
}

function _convert(node: Root | RootContent, color: string | null, list: RenderList = []): RenderList {
  switch (node.type) {
    case "element":
      console.assert(node.properties, 'element node did not have properties')
      console.assert(Array.isArray(node?.properties?.className), 'className was not an array');
      const classList = node?.properties?.className as string[];
      console.assert(classList.length === 1, 'properties too long');
      const className = classList[0] as string;
      const styles = rules.get(`.${className}`);
      const spanColor = styles?.has('color') ? styles.get('color') : null;
      // console.assert(classType.has(className), `className ${className} missing`);
      node.children?.forEach(child => _convert(child, spanColor, list));
      break;
    case "root":
      list.push([]);
      node.children?.forEach(child => _convert(child, null, list));
      break;
    case "text":
      console.assert(node.value, 'text node did not have value');
      const text = node.value as string;
      const [first, ...rest] = text.split('\n');
      last(list).push(color ? [first, color] : [first]);
      for (const text of rest) {
        list.push([]);
        last(list).push(color ? [text, color] : [text]);
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

type Transformation = ['C' | 'D' | 'K', string, string?][][];

function splitText(thang: RenderList) {
  return thang.map((line: [string, string?][]) => line.flatMap(
    (token: [string, string?]): [string, string?][] => {
      if (token.length === 1) {
        return token[0].split('').map(char => [char]);
      }
      return [token];
    }
  ));
}

export async function transform(lhs: string, rhs: string, language: string): Promise<Transformation> {
  const lhp = splitText(await parse(lhs, language));
  const rhp = splitText(await parse(rhs, language));
  const result = structuredClone(lhp) as string[][][];
  
  result.forEach(line => line.forEach(token => token.unshift('K')));

  diff(lhp, rhp)?.forEach(change => {
    if (change.kind === 'E') {
      const [line, at, which] = change.path as [number, number, number?];
      if (which === 0) {
        result[line][at][0] = 'D';
        const created = ['C', <unknown>change.rhs as string];
        if (lhp[line][at].length === 2) created.push(rhp[line][at][1] as string);
        result[line].splice(at + 1, 0, created);
      }
    }
  })
  return result as Transformation;
}
