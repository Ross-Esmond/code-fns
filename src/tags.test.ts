import { language, ready, parse, diff, toString } from './tags';
import { describe, expect, test } from 'vitest';

const tsx = language.tsx;

const blue = '#79c0ff';
const greyBlue = '#c9d1d9';
const brightBlue = '#a5d6ff';
const midtone = '#8b949e';
const lightRed = '#ff7b72';
const violet = '#d2a8ff';
const orange = '#ffa657';
const lightBlue = '#a5d6ff';

test('highlights code', async () => {
  const code = tsx`true;`;
  await ready();
  expect(parse(code)).toEqual([
    { code: 'true', color: blue },
    { code: ';', color: greyBlue },
  ]);
});

test('highlights numbers', async () => {
  const code = tsx`5`;
  await ready();
  expect(parse(code)).toEqual([{ code: '5', color: blue }]);
});

test('highlights an operator', async () => {
  const code = tsx`5+3`;
  await ready();
  expect(parse(code)).toEqual([
    { code: '5', color: blue },
    { code: '+', color: lightRed },
    { code: '3', color: blue },
  ]);
});

test('highlights a function declaration', async () => {
  const code = tsx`function n(){}`;
  await ready();
  expect(parse(code)).toEqual([
    { code: 'function', color: lightRed },
    { code: ' ', color: greyBlue },
    { code: 'n', color: violet },
    { code: '(){}', color: greyBlue },
  ]);
});

test('highlights a variable declaration', async () => {
  const code = tsx`var what;`;
  await ready();
  expect(parse(code)).toEqual([
    { code: 'var', color: lightRed },
    { code: ' ', color: greyBlue },
    { code: 'what', color: greyBlue },
    { code: ';', color: greyBlue },
  ]);
});

test('highlights a parameter', async () => {
  const code = tsx`function n(param){}`;
  await ready();
  expect(parse(code)).toEqual([
    { code: 'function', color: lightRed },
    { code: ' ', color: greyBlue },
    { code: 'n', color: violet },
    { code: '(', color: greyBlue },
    { code: 'param', color: orange },
    { code: '){}', color: greyBlue },
  ]);
});

test('highlights a regular expression', async () => {
  const code = tsx`/r/g`;
  await ready();
  expect(parse(code)).toEqual([
    { code: '/', color: lightBlue },
    { code: 'r', color: lightBlue },
    { code: '/', color: lightBlue },
    { code: 'g', color: lightRed },
  ]);
});

test('highlights a string', async () => {
  const code = tsx`'s'`;
  await ready();
  expect(parse(code)).toEqual([
    { code: `'`, color: lightBlue },
    { code: `s`, color: lightBlue },
    { code: `'`, color: lightBlue },
  ]);
});

test('highlights a comment', async () => {
  const code = tsx`/*c*/`;
  await ready();
  expect(parse(code)).toEqual([{ code: `/*c*/`, color: midtone }]);
});

describe('code style override', async () => {
  test('override a string', async () => {
    const code = tsx`'s'`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          stringContent: { text: '#ffeeee' },
          stringPunctuation: { text: '#eeeeff' },
        },
      }),
    ).toEqual([
      { code: `'`, color: '#eeeeff' },
      { code: 's', color: '#ffeeee' },
      { code: `'`, color: '#eeeeff' },
    ]);
  });

  test('override a regex using deprecated syntax', async () => {
    const code = tsx`/r/g`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          regexpContent: { text: '#ffeeff' },
        },
      }),
    ).toEqual([
      { code: `/`, color: brightBlue },
      { code: `r`, color: '#ffeeff' },
      { code: `/`, color: brightBlue },
      { code: `g`, color: lightRed },
    ]);
  });

  test('override a regex using a flat color', async () => {
    const code = tsx`/r/g`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          regexp: { text: '#ffffff' },
        },
      }),
    ).toEqual([
      { code: `/`, color: '#ffffff' },
      { code: `r`, color: '#ffffff' },
      { code: `/`, color: '#ffffff' },
      { code: `g`, color: '#ffffff' },
    ]);
  });

  test('override a regex using discrete colors', async () => {
    const code = tsx`/r/g`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          regexp: { brackets: '#ffffff', content: '#ff0000', flags: '#0000ff' },
        },
      }),
    ).toEqual([
      { code: `/`, color: '#ffffff' },
      { code: `r`, color: '#ff0000' },
      { code: `/`, color: '#ffffff' },
      { code: `g`, color: '#0000ff' },
    ]);
  });

  test('override a variable declaration', async () => {
    const code = tsx`let w`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          variable: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `let`, color: lightRed },
      { code: ` `, color: greyBlue },
      { code: `w`, color: '#ff0000' },
    ]);
  });

  test('override a parameter declaration', async () => {
    const code = tsx`(p)=>null`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          parameter: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `(`, color: greyBlue },
      { code: `p`, color: '#ff0000' },
      { code: `)`, color: greyBlue },
      { code: `=>`, color: lightRed },
      { code: `null`, color: blue },
    ]);
  });

  test('override a comment', async () => {
    const code = tsx`// c`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          comment: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `// c`, color: '#ff0000' }]);
  });

  test('override a number literal using deprecated syntax', async () => {
    const code = tsx`5`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          literal: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `5`, color: '#ff0000' }]);
  });

  test('override a number literal', async () => {
    const code = tsx`5`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          literal: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `5`, color: '#ff0000' }]);
  });

  test('override a boolean literal using deprecated syntax', async () => {
    const code = tsx`true`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          literal: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `true`, color: '#ff0000' }]);
  });

  test('override a boolean literal', async () => {
    const code = tsx`true`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          literal: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `true`, color: '#ff0000' }]);
  });

  test('override a keyword', async () => {
    const code = tsx`const`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          keyword: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `const`, color: '#ff0000' }]);
  });

  test('override an entityName', async () => {
    const code = tsx`en()`;
    await ready();
    expect(
      parse(code, {
        codeStyle: {
          entityName: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `en`, color: '#ff0000' },
      { code: `()`, color: greyBlue },
    ]);
  });
});

describe('parse', () => {
  describe('undent', () => {
    test('keep', async () => {
      await ready();
      const tsx = language.tsx;
      const result = parse(tsx`    true`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "    ",
            "color": "#c9d1d9",
          },
          {
            "code": "true",
            "color": "#79c0ff",
          },
        ]
      `);
    });

    test('fix', async () => {
      await ready();
      const tsx = language.tsx;
      const result = parse(tsx`
        true`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "true",
            "color": "#79c0ff",
          },
        ]
      `);
    });

    test('template', async () => {
      await ready();
      const tsx = language.tsx;
      const result = parse(tsx`
        ${'true'}`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "true",
            "color": "#79c0ff",
          },
        ]
      `);
    });

    test('replacement', async () => {
      await ready();
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
      await ready();
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
      await ready();
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
    await ready();
    const tsx = language.tsx;
    const result = parse(tsx`() => true`);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "code": "() ",
          "color": "#c9d1d9",
        },
        {
          "code": "=>",
          "color": "#ff7b72",
        },
        {
          "code": " ",
          "color": "#c9d1d9",
        },
        {
          "code": "true",
          "color": "#79c0ff",
        },
      ]
    `);

    const generate = (result: string) => tsx`(${result});`;
    const two = parse(generate('false'));
    expect(two).toMatchInlineSnapshot(`
      [
        {
          "code": "(",
          "color": "#c9d1d9",
        },
        {
          "code": "false",
          "color": "#79c0ff",
        },
        {
          "code": ");",
          "color": "#c9d1d9",
        },
      ]
    `);

    const three = diff(generate('true'), generate('false'));
    expect(three).toMatchInlineSnapshot(`
      [
        {
          "code": "(",
          "color": "#c9d1d9",
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
          "color": "#79c0ff",
          "from": [
            1,
            0,
          ],
          "morph": "delete",
          "to": null,
        },
        {
          "code": "false",
          "color": "#79c0ff",
          "from": null,
          "morph": "create",
          "to": [
            1,
            0,
          ],
        },
        {
          "code": ");",
          "color": "#c9d1d9",
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
    await ready();
    const start = tsx`true;`;
    const end = tsx`true;`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: blue,
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: ';',
        color: greyBlue,
        morph: 'retain',
        from: [4, 0],
        to: [4, 0],
      },
    ]);
  });

  test('different inputs', async () => {
    await ready();
    const start = tsx`${'true'};`;
    const end = tsx`${'false'};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: blue,
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'false',
        color: blue,
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: greyBlue,
        morph: 'retain',
        from: [4, 0],
        to: [5, 0],
      },
    ]);
  });

  test('nested inputs', async () => {
    await ready();
    const start = tsx`${tsx`true`};`;
    const end = tsx`${tsx`false`};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: blue,
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'false',
        color: blue,
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: greyBlue,
        morph: 'retain',
        from: [4, 0],
        to: [5, 0],
      },
    ]);
  });

  test('tagged vs string', async () => {
    await ready();
    const start = tsx`${'true'};`;
    const end = tsx`${tsx`true`};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: blue,
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'true',
        color: blue,
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: greyBlue,
        morph: 'retain',
        from: [4, 0],
        to: [4, 0],
      },
    ]);
  });

  test('partial token mismatch', async () => {
    await ready();
    const start = tsx`foo${'bar'}`;
    const end = tsx`foo${'baz'}`;
    expect(diff(start, end)).toEqual([
      {
        code: 'foo',
        color: greyBlue,
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: 'bar',
        color: greyBlue,
        morph: 'delete',
        from: [3, 0],
        to: null,
      },
      {
        code: 'baz',
        color: greyBlue,
        morph: 'create',
        from: null,
        to: [3, 0],
      },
    ]);
  });

  test('recursive', async () => {
    await ready();
    const start = tsx`${tsx`1+${tsx`2`}`};`;
    const end = tsx`${tsx`1+${tsx`3`}`};`;
    expect(diff(start, end)).toEqual([
      {
        code: '1',
        color: blue,
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: '+',
        color: lightRed,
        morph: 'retain',
        from: [1, 0],
        to: [1, 0],
      },
      { code: '2', color: blue, morph: 'delete', from: [2, 0], to: null },
      { code: '3', color: blue, morph: 'create', from: null, to: [2, 0] },
      {
        code: ';',
        color: greyBlue,
        morph: 'retain',
        from: [3, 0],
        to: [3, 0],
      },
    ]);
  });

  test('indented', async () => {
    await ready();
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
          "color": "#c9d1d9",
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
          "color": "#79c0ff",
          "from": [
            2,
            1,
          ],
          "morph": "delete",
          "to": null,
        },
        {
          "code": "false",
          "color": "#79c0ff",
          "from": null,
          "morph": "create",
          "to": [
            2,
            1,
          ],
        },
        {
          "code": "}",
          "color": "#c9d1d9",
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
