import css from 'css';
import fs from 'fs';

const styles = fs.readFileSync('./dark.txt').toString();

const rules = new Map();
const scopePrefix = '.markdown-body ';
const prefix = '.pl-';
for (const rule of walkRules(css.parse(styles))) {
  if (rule.selectors) {
    const selectors = rule.selectors
      .filter((d) => d.startsWith(scopePrefix))
      .map((d) => d.slice(scopePrefix.length))
      .filter((d) => d.startsWith(prefix));

    if (selectors.length > 0) {
      const settings = {};
      rule.declarations?.forEach((declaration) => {
        settings[declaration.property] = declaration.value;
      });
      selectors.forEach((selector) => {
        rules.set(selector, settings);
      });
    }
  }
}

function* walkRules(ast) {
  if (ast.type === 'stylesheet' && 'stylesheet' in ast && ast.stylesheet) {
    for (const rule of ast.stylesheet.rules) {
      if (rule.type === 'rule') {
        yield rule;
      } else {
        yield* walkRules(rule);
      }
    }
  }
}

console.log(JSON.stringify(Object.fromEntries(rules.entries()), null, 2));
