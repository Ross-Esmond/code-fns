import { language, parse, diff } from './tags';
import { describe, expect, test } from 'vitest';

const tsx = language.tsx;

test('highlights code', async () => {
  const code = tsx`true;`;
  expect(await parse(code)).toEqual([
    { code: 'true', color: '#79c0ff' },
    { code: ';', color: null },
  ]);
});

describe('diff', () => {
  test('equal inputs', async () => {
    const start = tsx`true;`;
    const end = tsx`true;`;
    expect(await diff(start, end)).toEqual([
      { code: 'true', color: '#79c0ff', morph: 'retain' },
      { code: ';', color: null, morph: 'retain' },
    ]);
  });

  test('different inputs', async () => {
    const start = tsx`${'true'};`;
    const end = tsx`${'false'};`;
    expect(await diff(start, end)).toEqual([
      { code: 'true', color: '#79c0ff', morph: 'delete' },
      { code: 'false', color: '#79c0ff', morph: 'create' },
      { code: ';', color: null, morph: 'retain' },
    ]);
  });

  test('nested inputs', async () => {
    const start = tsx`${tsx`true`};`;
    const end = tsx`${tsx`false`};`;
    expect(await diff(start, end)).toEqual([
      { code: 'true', color: '#79c0ff', morph: 'delete' },
      { code: 'false', color: '#79c0ff', morph: 'create' },
      { code: ';', color: null, morph: 'retain' },
    ]);
  });

  test('tagged vs string', async () => {
    const start = tsx`${'true'};`;
    const end = tsx`${tsx`true`};`;
    expect(await diff(start, end)).toEqual([
      { code: 'true', color: '#79c0ff', morph: 'delete' },
      { code: 'true', color: '#79c0ff', morph: 'create' },
      { code: ';', color: null, morph: 'retain' },
    ]);
  });

  test('partial token mismatch', async () => {
    const start = tsx`foo${'bar'}`;
    const end = tsx`foo${'baz'}`;
    expect(await diff(start, end)).toEqual([
      { code: 'foo', color: '#c9d1d9', morph: 'retain' },
      { code: 'bar', color: '#c9d1d9', morph: 'delete' },
      { code: 'baz', color: '#c9d1d9', morph: 'create' },
    ]);
  });

  test('recursive', async () => {
    const start = tsx`${tsx`1+${tsx`2`}`};`;
    const end = tsx`${tsx`1+${tsx`3`}`};`;
    expect(await diff(start, end)).toEqual([
      { code: '1', color: '#79c0ff', morph: 'retain' },
      { code: '+', color: '#ff7b72', morph: 'retain' },
      { code: '2', color: '#79c0ff', morph: 'delete' },
      { code: '3', color: '#79c0ff', morph: 'create' },
      { code: ';', color: null, morph: 'retain' },
    ]);
  });
});
