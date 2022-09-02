import { describe, it, expect } from 'vitest';
import { ready, clean } from './code';
import { color, Undertone, tokenize } from './color';

describe('colorTokens', () => {
  it('should color tokens', async () => {
    await ready();
    expect(tokenize(color(['tsx', 'true']))).toMatchInlineSnapshot(`
      {
        "language": "tsx",
        "lines": [
          {
            "background": undefined,
            "number": 1,
            "tags": [],
          },
        ],
        "tokens": [
          {
            "background": undefined,
            "color": "#79c0ff",
            "location": [
              0,
              0,
            ],
            "token": "true",
          },
        ],
      }
    `);
  });

  it('should highlight tokens', async () => {
    await ready();
    expect(
      tokenize(
        clean(color(['tsx', '/*<<b*/true/*>>*/'], { b: Undertone.Blue })),
      ),
    ).toMatchInlineSnapshot(`
      {
        "language": "tsx",
        "lines": [
          {
            "background": undefined,
            "number": 1,
            "tags": [],
          },
        ],
        "tokens": [
          {
            "background": "#011c39",
            "color": "#79c0ff",
            "location": [
              0,
              0,
            ],
            "token": "true",
          },
        ],
      }
    `);
  });

  it.only('should highlight lines', async () => {
    await ready();
    expect(
      tokenize(
        clean(color(['tsx', '//<< b\ntrue\n//>>'], { b: Undertone.Blue })),
      ),
    ).toMatchInlineSnapshot(`
      {
        "language": "tsx",
        "lines": [
          {
            "background": "#011c39",
            "number": 1,
            "tags": [
              "b",
            ],
          },
        ],
        "tokens": [
          {
            "background": undefined,
            "color": "#79c0ff",
            "location": [
              0,
              0,
            ],
            "token": "true",
          },
        ],
      }
    `);
  });
});
