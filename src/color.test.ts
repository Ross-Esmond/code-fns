import { describe, it, expect } from 'vitest';
import { parse, process } from './code';
import { color, Undertone } from './color';
import { tokenize } from './transition';

describe('colorTokens', () => {
  it('should color tokens', async () => {
    const parsed = await parse('tsx', 'true');
    expect(tokenize(color(parsed))).toMatchInlineSnapshot(`
      {
        "language": "tsx",
        "tokens": [
          {
            "background": undefined,
            "classList": [
              "pl-c1",
            ],
            "color": "#79c0ff",
            "location": [
              0,
              0,
            ],
            "provinance": undefined,
            "sections": [],
            "token": "true",
          },
        ],
      }
    `);
  });

  it('should highlight tokens', async () => {
    const parsed = await parse('tsx', '/*<<b*/true/*>>*/');
    expect(tokenize(process(color(parsed, { b: Undertone.Blue }), {})))
      .toMatchInlineSnapshot(`
      {
        "language": "tsx",
        "tokens": [
          {
            "background": "#011c39",
            "classList": [
              "pl-c1",
            ],
            "color": "#79c0ff",
            "location": [
              0,
              0,
            ],
            "provinance": undefined,
            "sections": [
              [
                "b",
              ],
            ],
            "token": "true",
          },
        ],
      }
    `);
  });
});
