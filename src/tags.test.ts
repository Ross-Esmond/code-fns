import { language, ready, parse, diff, toString } from './tags';
import { describe, expect, test } from 'vitest';

const tsx = language.tsx;

test('highlights code', async () => {
  const code = tsx`true;`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([
    { code: 'true', color: '#79B8FF' },
    { code: ';', color: '#E1E4E8' },
  ]);
});

test('highlights numbers', async () => {
  const code = tsx`5`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([{ code: '5', color: '#79B8FF' }]);
});

test('highlights an operator', async () => {
  const code = tsx`5+3`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([
    { code: '5', color: '#79B8FF' },
    { code: '+', color: '#F97583' },
    { code: '3', color: '#79B8FF' },
  ]);
});

test('highlights a function declaration', async () => {
  const code = tsx`function n(){}`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([
    { code: 'function', color: '#F97583' },
    { code: ' ', color: '#E1E4E8' },
    { code: 'n', color: '#B392F0' },
    { code: '(){}', color: '#E1E4E8' },
  ]);
});

test('highlights a variable declaration', async () => {
  const code = tsx`var what;`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([
    { code: 'var', color: '#F97583' },
    { code: ' what;', color: '#E1E4E8' },
  ]);
});

test('highlights a parameter', async () => {
  const code = tsx`function n(param){}`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([
    { code: 'function', color: '#F97583' },
    { code: ' ', color: '#E1E4E8' },
    { code: 'n', color: '#B392F0' },
    { code: '(', color: '#E1E4E8' },
    { code: 'param', color: '#FFAB70' },
    { code: '){}', color: '#E1E4E8' },
  ]);
});

test('highlights a regular expression', async () => {
  const code = tsx`/r/g`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([
    { code: '/', color: '#9ECBFF' },
    { code: 'r', color: '#DBEDFF' },
    { code: '/', color: '#9ECBFF' },
    { code: 'g', color: '#F97583' },
  ]);
});

test('highlights a string', async () => {
  const code = tsx`'s'`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([{ code: `'s'`, color: '#9ECBFF' }]);
});

test('highlights a comment', async () => {
  const code = tsx`/*c*/`;
  await ready(['tsx']);
  expect(parse(code)).toEqual([{ code: `/*c*/`, color: '#6A737D' }]);
});

describe('code style override', async () => {
  test('override a string', async () => {
    const code = tsx`'s'`;
    await ready(['tsx']);
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
    await ready(['tsx']);
    expect(
      parse(code, {
        codeStyle: {
          regexpContent: { text: '#ffeeff' },
        },
      }),
    ).toEqual([
      { code: `/`, color: '#9ECBFF' },
      { code: `r`, color: '#ffeeff' },
      { code: `/`, color: '#9ECBFF' },
      { code: `g`, color: '#F97583' },
    ]);
  });

  test('override a regex using a flat color', async () => {
    const code = tsx`/r/g`;
    await ready(['tsx']);
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

  test('override a regex using a discrete colors', async () => {
    const code = tsx`/r/g`;
    await ready(['tsx']);
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
    await ready(['tsx']);
    expect(
      parse(code, {
        codeStyle: {
          variable: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `let`, color: '#F97583' },
      { code: ` `, color: '#E1E4E8' },
      { code: `w`, color: '#ff0000' },
    ]);
  });

  test('override a parameter declaration', async () => {
    const code = tsx`(p)=>null`;
    await ready(['tsx']);
    expect(
      parse(code, {
        codeStyle: {
          parameter: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `(`, color: '#E1E4E8' },
      { code: `p`, color: '#ff0000' },
      { code: `)`, color: '#E1E4E8' },
      { code: `=>`, color: '#F97583' },
      { code: `null`, color: '#79B8FF' },
    ]);
  });

  test('override a comment', async () => {
    const code = tsx`// c`;
    await ready(['tsx']);
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
    await ready(['tsx']);
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
    await ready(['tsx']);
    expect(
      parse(code, {
        codeStyle: {
          number: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `5`, color: '#ff0000' }]);
  });

  test('override a boolean literal using deprecated syntax', async () => {
    const code = tsx`true`;
    await ready(['tsx']);
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
    await ready(['tsx']);
    expect(
      parse(code, {
        codeStyle: {
          boolean: { text: '#ff0000' },
        },
      }),
    ).toEqual([{ code: `true`, color: '#ff0000' }]);
  });

  test('override a keyword', async () => {
    const code = tsx`const`;
    await ready(['tsx']);
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
    await ready(['tsx']);
    expect(
      parse(code, {
        codeStyle: {
          entityName: { text: '#ff0000' },
        },
      }),
    ).toEqual([
      { code: `en`, color: '#ff0000' },
      { code: `()`, color: '#E1E4E8' },
    ]);
  });
});

describe('parse', () => {
  describe('undent', () => {
    test('keep', async () => {
      await ready(['tsx']);
      const tsx = language.tsx;
      const result = parse(tsx`    true`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "    ",
            "color": "#E1E4E8",
          },
          {
            "code": "true",
            "color": "#79B8FF",
          },
        ]
      `);
    });

    test('fix', async () => {
      await ready(['tsx']);
      const tsx = language.tsx;
      const result = parse(tsx`
        true`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "true",
            "color": "#79B8FF",
          },
        ]
      `);
    });

    test('template', async () => {
      await ready(['tsx']);
      const tsx = language.tsx;
      const result = parse(tsx`
        ${'true'}`);
      expect(result).toMatchInlineSnapshot(`
        [
          {
            "code": "true",
            "color": "#79B8FF",
          },
        ]
      `);
    });

    test('replacement', async () => {
      await ready(['tsx']);
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
      await ready(['tsx']);
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
      await ready(['tsx']);
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
    await ready(['tsx']);
    const tsx = language.tsx;
    const result = parse(tsx`() => true`);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "code": "() ",
          "color": "#E1E4E8",
        },
        {
          "code": "=>",
          "color": "#F97583",
        },
        {
          "code": " ",
          "color": "#E1E4E8",
        },
        {
          "code": "true",
          "color": "#79B8FF",
        },
      ]
    `);

    const generate = (result: string) => tsx`(${result});`;
    const two = parse(generate('false'));
    expect(two).toMatchInlineSnapshot(`
      [
        {
          "code": "(",
          "color": "#E1E4E8",
        },
        {
          "code": "false",
          "color": "#79B8FF",
        },
        {
          "code": ");",
          "color": "#E1E4E8",
        },
      ]
    `);

    const three = diff(generate('true'), generate('false'));
    expect(three).toMatchInlineSnapshot(`
      [
        {
          "code": "(",
          "color": "#E1E4E8",
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
          "color": "#79B8FF",
          "from": [
            1,
            0,
          ],
          "morph": "delete",
          "to": null,
        },
        {
          "code": "false",
          "color": "#79B8FF",
          "from": null,
          "morph": "create",
          "to": [
            1,
            0,
          ],
        },
        {
          "code": ");",
          "color": "#E1E4E8",
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
    await ready(['tsx']);
    const start = tsx`true;`;
    const end = tsx`true;`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: '#79B8FF',
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: ';',
        color: '#E1E4E8',
        morph: 'retain',
        from: [4, 0],
        to: [4, 0],
      },
    ]);
  });

  test('different inputs', async () => {
    await ready(['tsx']);
    const start = tsx`${'true'};`;
    const end = tsx`${'false'};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: '#79B8FF',
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'false',
        color: '#79B8FF',
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: '#E1E4E8',
        morph: 'retain',
        from: [4, 0],
        to: [5, 0],
      },
    ]);
  });

  test('nested inputs', async () => {
    await ready(['tsx']);
    const start = tsx`${tsx`true`};`;
    const end = tsx`${tsx`false`};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: '#79B8FF',
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'false',
        color: '#79B8FF',
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: '#E1E4E8',
        morph: 'retain',
        from: [4, 0],
        to: [5, 0],
      },
    ]);
  });

  test('tagged vs string', async () => {
    await ready(['tsx']);
    const start = tsx`${'true'};`;
    const end = tsx`${tsx`true`};`;
    expect(diff(start, end)).toEqual([
      {
        code: 'true',
        color: '#79B8FF',
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'true',
        color: '#79B8FF',
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: '#E1E4E8',
        morph: 'retain',
        from: [4, 0],
        to: [4, 0],
      },
    ]);
  });

  test('partial token mismatch', async () => {
    await ready(['tsx']);
    const start = tsx`foo${'bar'}`;
    const end = tsx`foo${'baz'}`;
    expect(diff(start, end)).toEqual([
      {
        code: 'foo',
        color: '#E1E4E8',
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: 'bar',
        color: '#E1E4E8',
        morph: 'delete',
        from: [3, 0],
        to: null,
      },
      {
        code: 'baz',
        color: '#E1E4E8',
        morph: 'create',
        from: null,
        to: [3, 0],
      },
    ]);
  });

  test('recursive', async () => {
    await ready(['tsx']);
    const start = tsx`${tsx`1+${tsx`2`}`};`;
    const end = tsx`${tsx`1+${tsx`3`}`};`;
    expect(diff(start, end)).toEqual([
      {
        code: '1',
        color: '#79B8FF',
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: '+',
        color: '#F97583',
        morph: 'retain',
        from: [1, 0],
        to: [1, 0],
      },
      { code: '2', color: '#79B8FF', morph: 'delete', from: [2, 0], to: null },
      { code: '3', color: '#79B8FF', morph: 'create', from: null, to: [2, 0] },
      {
        code: ';',
        color: '#E1E4E8',
        morph: 'retain',
        from: [3, 0],
        to: [3, 0],
      },
    ]);
  });

  test('indented', async () => {
    await ready(['tsx']);
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
          "color": "#E1E4E8",
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
          "color": "#79B8FF",
          "from": [
            2,
            1,
          ],
          "morph": "delete",
          "to": null,
        },
        {
          "code": "false",
          "color": "#79B8FF",
          "from": null,
          "morph": "create",
          "to": [
            2,
            1,
          ],
        },
        {
          "code": "}",
          "color": "#E1E4E8",
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
