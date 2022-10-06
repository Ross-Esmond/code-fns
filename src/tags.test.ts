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
          "morph": "retain",
        },
        {
          "code": "true",
          "color": "#79c0ff",
          "morph": "delete",
        },
        {
          "code": "false",
          "color": "#79c0ff",
          "morph": "create",
        },
        {
          "code": ");",
          "color": "#c9d1d9",
          "morph": "retain",
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
      { code: 'true', color: '#79c0ff', morph: 'retain' },
      { code: ';', color: '#c9d1d9', morph: 'retain' },
    ]);
  });

  test('different inputs', async () => {
    await ready();
    const start = tsx`${'true'};`;
    const end = tsx`${'false'};`;
    expect(diff(start, end)).toEqual([
      { code: 'true', color: '#79c0ff', morph: 'delete' },
      { code: 'false', color: '#79c0ff', morph: 'create' },
      { code: ';', color: '#c9d1d9', morph: 'retain' },
    ]);
  });

  test('nested inputs', async () => {
    await ready();
    const start = tsx`${tsx`true`};`;
    const end = tsx`${tsx`false`};`;
    expect(diff(start, end)).toEqual([
      { code: 'true', color: '#79c0ff', morph: 'delete' },
      { code: 'false', color: '#79c0ff', morph: 'create' },
      { code: ';', color: '#c9d1d9', morph: 'retain' },
    ]);
  });

  test('tagged vs string', async () => {
    await ready();
    const start = tsx`${'true'};`;
    const end = tsx`${tsx`true`};`;
    expect(diff(start, end)).toEqual([
      { code: 'true', color: '#79c0ff', morph: 'delete' },
      { code: 'true', color: '#79c0ff', morph: 'create' },
      { code: ';', color: '#c9d1d9', morph: 'retain' },
    ]);
  });

  test('partial token mismatch', async () => {
    await ready();
    const start = tsx`foo${'bar'}`;
    const end = tsx`foo${'baz'}`;
    expect(diff(start, end)).toEqual([
      { code: 'foo', color: '#c9d1d9', morph: 'retain' },
      { code: 'bar', color: '#c9d1d9', morph: 'delete' },
      { code: 'baz', color: '#c9d1d9', morph: 'create' },
    ]);
  });

  test('recursive', async () => {
    await ready();
    const start = tsx`${tsx`1+${tsx`2`}`};`;
    const end = tsx`${tsx`1+${tsx`3`}`};`;
    expect(diff(start, end)).toEqual([
      { code: '1', color: '#79c0ff', morph: 'retain' },
      { code: '+', color: '#ff7b72', morph: 'retain' },
      { code: '2', color: '#79c0ff', morph: 'delete' },
      { code: '3', color: '#79c0ff', morph: 'create' },
      { code: ';', color: '#c9d1d9', morph: 'retain' },
    ]);
  });
});
