import { language, ready, parse, diff, toString } from './tags';
import { describe, expect, test } from 'vitest';
import { CodeStyle } from './style';

const tsx = language.tsx;

const pink = '#ff0000';

const keyword = '#708';
const atom = '#219';
const number = '#164';
const operator = 'black';
const def = '#00f';
const comment = '#a50';
const string = '#a11';
const string2 = '#f50';
const fallback = 'black';

const allPink: CodeStyle = {
  fallback: { text: pink },
  keyword: { text: pink },
  atom: { text: pink },
  comment: { text: pink },
  variable: { text: pink },
  regexp: { text: pink },
  number: { text: pink },
  operator: { text: pink },
  string: { text: pink },
  entityName: { text: pink },
};

test('highlights code', async () => {
  const code = tsx`true;`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([
    { code: 'true', color: atom },
    { code: ';', color: fallback },
  ]);
});

test('highlights numbers', async () => {
  const code = tsx`5`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([{ code: '5', color: number }]);
});

test('highlights an operator', async () => {
  const code = tsx`5+3`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([
    { code: '5', color: number },
    { code: '+', color: fallback },
    { code: '3', color: number },
  ]);
});

test('highlights a function declaration', async () => {
  const code = tsx`function n(){}`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([
    { code: 'function', color: keyword },
    { code: ' ', color: fallback },
    { code: 'n', color: def },
    { code: '(', color: fallback },
    { code: ')', color: fallback },
    { code: '{', color: fallback },
    { code: '}', color: fallback },
  ]);
});

test('highlights a variable declaration', async () => {
  const code = tsx`var what;`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([
    { code: 'var', color: keyword },
    { code: ' ', color: fallback },
    { code: 'what', color: def },
    { code: ';', color: fallback },
  ]);
});

test('highlights a parameter', async () => {
  const code = tsx`function n(param){}`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([
    { code: 'function', color: keyword },
    { code: ' ', color: fallback },
    { code: 'n', color: def },
    { code: '(', color: fallback },
    { code: 'param', color: def },
    { code: ')', color: fallback },
    { code: '{', color: fallback },
    { code: '}', color: fallback },
  ]);
});

test('highlights a regular expression', async () => {
  const code = tsx`/r/g`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([{ code: '/r/g', color: string2 }]);
});

test('highlights a string', async () => {
  const code = tsx`'s'`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([{ code: `'s'`, color: string }]);
});

test('highlights a comment', async () => {
  const code = tsx`/*c*/`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([{ code: `/*c*/`, color: comment }]);
});

/*
test.skip('highlights svelte', async () => {
  const code = language.svelte`<p/>`;
  await ready({ langs: ['tsx'] });
  expect(parse(code)).toEqual([
    { code: `<`, color: greyBlue },
    { code: `p`, color: green },
    { code: `/>`, color: greyBlue },
  ]);
});
*/

describe('code style override', async () => {
  test('overrides the base color', async () => {
    const code = language.tsx`true;`;
    await ready({ langs: ['tsx'] });
    expect(parse(code, { codeStyle: allPink })).toEqual([
      { code: `true`, color: pink },
      { code: `;`, color: pink },
    ]);
  });

  test('override a string', async () => {
    const code = tsx`'s'`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          string: { text: '#ffeeee' },
        },
      }),
    ).toEqual([{ code: `'s'`, color: '#ffeeee' }]);
  });

  test('override a regex', async () => {
    const code = tsx`/r/g`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          regexp: { text: '#ffffff' },
        },
      }),
    ).toEqual([{ code: `/r/g`, color: '#ffffff' }]);
  });

  test('override a variable declaration', async () => {
    const code = tsx`let w`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          entityName: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `let`, color: keyword },
      { code: ` `, color: fallback },
      { code: `w`, color: '#ff0000' },
    ]);
  });

  test('override a parameter declaration', async () => {
    const code = tsx`(p)=>null`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          entityName: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `(`, color: fallback },
      { code: `p`, color: '#ff0000' },
      { code: `)`, color: fallback },
      { code: `=>`, color: operator },
      { code: `null`, color: atom },
    ]);
  });

  test('override a comment', async () => {
    const code = tsx`// c`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          comment: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `// c`, color: '#ff0000' }]);
  });

  test('override a number literal', async () => {
    const code = tsx`5`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          number: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `5`, color: '#ff0000' }]);
  });

  test('override an atom', async () => {
    const code = tsx`true`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          atom: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `true`, color: '#ff0000' }]);
  });

  test('override a keyword', async () => {
    const code = tsx`const`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          keyword: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `const`, color: '#ff0000' }]);
  });

  test('override a variable', async () => {
    const code = tsx`en()`;
    await ready({ langs: ['tsx'] });
    expect(
      parse(code, {
        codeStyle: {
          variable: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `en`, color: '#ff0000' },
      { code: `(`, color: fallback },
      { code: `)`, color: fallback },
    ]);
  });

  /*
  test.skip('overrides entity name tag', async () => {
    const code = language.svelte`<p/>`;
    await ready({ langs: ['tsx'] });
    expect(parse(code, { codeStyle: allPink })).toEqual([
      { code: `<`, color: pink },
      { code: `p`, color: pink },
      { code: `/>`, color: pink },
    ]);
  });
  */
});

describe('parse', () => {
  describe('undent', () => {
    test('keep', async () => {
      await ready({ langs: ['tsx'] });
      const tsx = language.tsx;
      const result = parse(tsx`    true`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "    ",
            "color": "black",
          },
          {
            "code": "true",
            "color": "#219",
          },
        ]
      `);
    });

    test('fix', async () => {
      await ready({ langs: ['tsx'] });
      const tsx = language.tsx;
      const result = parse(tsx`
        true`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "true",
            "color": "#219",
          },
        ]
      `);
    });

    test('template', async () => {
      await ready({ langs: ['tsx'] });
      const tsx = language.tsx;
      const result = parse(tsx`
        ${'true'}`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "true",
            "color": "#219",
          },
        ]
      `);
    });

    test('replacement', async () => {
      await ready({ langs: ['tsx'] });
      const tsx = language.tsx;
      const replacement = `
        true`;
      const result = parse(tsx`
        true
        ${replacement}
        true`);
      expect(toString(result)).toMatchInlineSnapshot(`
        "true
        true
        true"
      `);
    });

    test('replacement with indentation', async () => {
      await ready({ langs: ['tsx'] });
      const tsx = language.tsx;
      const replacement = `true`;
      const result = parse(tsx`
        false
          ${replacement}`);
      expect(toString(result)).toMatchInlineSnapshot(`
        "false
          true"
      `);
    });

    test('reindents nested code', async () => {
      await ready({ langs: ['tsx'] });
      const tsx = language.tsx;
      const body = tsx`
some();
code();`;
      const result = parse(tsx`
function (${''}) {
  ${body}
}`);
      expect(toString(result)).toMatchInlineSnapshot(`
        "function () {
          some();
          code();
        }"
      `);
    });
  });

  test('README', async () => {
    await ready({ langs: ['tsx'] });
    const tsx = language.tsx;
    const result = parse(tsx`() => true`);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "code": "(",
          "color": "black",
        },
        {
          "code": ")",
          "color": "black",
        },
        {
          "code": " ",
          "color": "black",
        },
        {
          "code": "=>",
          "color": "black",
        },
        {
          "code": " ",
          "color": "black",
        },
        {
          "code": "true",
          "color": "#219",
        },
      ]
    `);

    const generate = (result: string) => tsx`(${result});`;
    const two = parse(generate('false'));
    expect(two).toMatchInlineSnapshot(`
      [
        {
          "code": "(",
          "color": "black",
        },
        {
          "code": "false",
          "color": "#219",
        },
        {
          "code": ")",
          "color": "black",
        },
        {
          "code": ";",
          "color": "black",
        },
      ]
    `);

    const three = diff(generate('true'), generate('false'));
    expect(three).toMatchInlineSnapshot(`
      [
        {
          "code": "(",
          "color": "black",
          "from": [
            0,
            0,
          ],
          "morph": "retain",
          "to": [
            0,
            0,
          ],
        },
        {
          "code": "true",
          "color": "#219",
          "from": [
            1,
            0,
          ],
          "morph": "delete",
          "to": null,
        },
        {
          "code": "false",
          "color": "#219",
          "from": null,
          "morph": "create",
          "to": [
            1,
            0,
          ],
        },
        {
          "code": ");",
          "color": "black",
          "from": [
            5,
            0,
          ],
          "morph": "retain",
          "to": [
            6,
            0,
          ],
        },
      ]
    `);
  });
});

describe('diff', () => {
  test('equal inputs', async () => {
    await ready({ langs: ['tsx'] });
    const start = tsx`true;`;
    const end = tsx`true;`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: atom,
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: ';',
        color: fallback,
        morph: 'retain',
        from: [4, 0],
        to: [4, 0],
      },
    ]);
  });

  test('different inputs', async () => {
    await ready({ langs: ['tsx'] });
    const start = tsx`${'true'};`;
    const end = tsx`${'false'};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: atom,
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'false',
        color: atom,
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: fallback,
        morph: 'retain',
        from: [4, 0],
        to: [5, 0],
      },
    ]);
  });

  test('double width characters', async () => {
    await ready({ langs: ['tsx'] });
    const start = tsx`${'한'};`;
    const end = tsx`${''};`;
    expect(diff(start, end)).toEqual([
      {
        code: '한',
        color: fallback,
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: ';',
        color: fallback,
        morph: 'retain',
        from: [2, 0],
        to: [0, 0],
      },
    ]);
  });

  test('nested inputs', async () => {
    await ready({ langs: ['tsx'] });
    const start = tsx`${tsx`true`};`;
    const end = tsx`${tsx`false`};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: atom,
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'false',
        color: atom,
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: fallback,
        morph: 'retain',
        from: [4, 0],
        to: [5, 0],
      },
    ]);
  });

  test('tagged vs string', async () => {
    await ready({ langs: ['tsx'] });
    const start = tsx`${'true'};`;
    const end = tsx`${tsx`true`};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: atom,
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'true',
        color: atom,
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: fallback,
        morph: 'retain',
        from: [4, 0],
        to: [4, 0],
      },
    ]);
  });

  test('partial token mismatch', async () => {
    await ready({ langs: ['tsx'] });
    const start = tsx`foo${'bar'}`;
    const end = tsx`foo${'baz'}`;
    expect(diff(start, end)).toEqual([
      {
        code: 'foo',
        color: fallback,
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: 'bar',
        color: fallback,
        morph: 'delete',
        from: [3, 0],
        to: null,
      },
      {
        code: 'baz',
        color: fallback,
        morph: 'create',
        from: null,
        to: [3, 0],
      },
    ]);
  });

  test('recursive', async () => {
    await ready({ langs: ['tsx'] });
    const start = tsx`${tsx`1+${tsx`2`}`};`;
    const end = tsx`${tsx`1+${tsx`3`}`};`;
    expect(diff(start, end)).toEqual([
      {
        code: '1',
        color: number,
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: '+',
        color: operator,
        morph: 'retain',
        from: [1, 0],
        to: [1, 0],
      },
      { code: '2', color: number, morph: 'delete', from: [2, 0], to: null },
      { code: '3', color: number, morph: 'create', from: null, to: [2, 0] },
      {
        code: ';',
        color: fallback,
        morph: 'retain',
        from: [3, 0],
        to: [3, 0],
      },
    ]);
  });

  test('indented', async () => {
    await ready({ langs: ['tsx'] });
    const truthy = tsx`
      true`;
    const falsy = tsx`
      false`;
    const start = tsx`
      {
        ${truthy}
      }`;
    const end = tsx`
      {
        ${falsy}
      }`;
    expect(diff(start, end)).toMatchInlineSnapshot(`
      [
        {
          "code": "{",
          "color": "black",
          "from": [
            0,
            0,
          ],
          "morph": "retain",
          "to": [
            0,
            0,
          ],
        },
        {
          "code": "true",
          "color": "#219",
          "from": [
            2,
            1,
          ],
          "morph": "delete",
          "to": null,
        },
        {
          "code": "false",
          "color": "#219",
          "from": null,
          "morph": "create",
          "to": [
            2,
            1,
          ],
        },
        {
          "code": "}",
          "color": "black",
          "from": [
            0,
            2,
          ],
          "morph": "retain",
          "to": [
            0,
            2,
          ],
        },
      ]
    `);
  });
});

describe('stock themes', () => {
  test('highlights code with nord', async () => {
    const code = tsx`true;`;
    await ready({ langs: ['tsx'], themes: ['nord'] });
    expect(parse(code, { theme: 'nord' })).toEqual([
      { code: 'true', color: '#b48ead' },
      { code: ';', color: '#d8dee9' },
    ]);
  });
});
