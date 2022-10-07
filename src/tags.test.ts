import { language, ready, parse, diff } from './tags';
import { describe, expect, test } from 'vitest';

const tsx = language.tsx;

test('highlights code', async () => {
  const code = tsx`true;`;
  await ready();
  expect(parse(code)).toEqual([
    { code: 'true', color: '#79c0ff' },
    { code: ';', color: '#c9d1d9' },
  ]);
});

describe('parse', () => {
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
        color: '#79c0ff',
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: ';',
        color: '#c9d1d9',
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
        color: '#79c0ff',
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'false',
        color: '#79c0ff',
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: '#c9d1d9',
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
        color: '#79c0ff',
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'false',
        color: '#79c0ff',
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: '#c9d1d9',
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
        color: '#79c0ff',
        morph: 'delete',
        from: [0, 0],
        to: null,
      },
      {
        code: 'true',
        color: '#79c0ff',
        morph: 'create',
        from: null,
        to: [0, 0],
      },
      {
        code: ';',
        color: '#c9d1d9',
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
        color: '#c9d1d9',
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: 'bar',
        color: '#c9d1d9',
        morph: 'delete',
        from: [3, 0],
        to: null,
      },
      {
        code: 'baz',
        color: '#c9d1d9',
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
        color: '#79c0ff',
        morph: 'retain',
        from: [0, 0],
        to: [0, 0],
      },
      {
        code: '+',
        color: '#ff7b72',
        morph: 'retain',
        from: [1, 0],
        to: [1, 0],
      },
      { code: '2', color: '#79c0ff', morph: 'delete', from: [2, 0], to: null },
      { code: '3', color: '#79c0ff', morph: 'create', from: null, to: [2, 0] },
      {
        code: ';',
        color: '#c9d1d9',
        morph: 'retain',
        from: [3, 0],
        to: [3, 0],
      },
    ]);
  });
});
