import { describe, it, expect } from 'vitest';
import { parse, color, substitute, transition } from './code';

describe('code', () => {
  it('should parse', async () => {
    expect(color(await parse('tsx', '() => true'))).toMatchInlineSnapshot(`
      [
        [
          "() ",
          [
            0,
            0,
          ],
        ],
        [
          "=>",
          [
            0,
            3,
          ],
          "#ff7b72",
        ],
        [
          " ",
          [
            0,
            5,
          ],
        ],
        [
          "true",
          [
            0,
            6,
          ],
          "#79c0ff",
        ],
      ]
    `);
  });

  it('should replace tags', async () => {
    expect(color(await substitute('tsx', '/*<t>*/', { t: 'true' }))).toEqual(
      color(await parse('tsx', 'true')),
    );
  });

  it('should keep tags', async () => {
    expect(color(await substitute('tsx', '/*<t>*/', {}))).toEqual(
      color(await parse('tsx', '/*<t>*/')),
    );
  });

  it('should transform', async () => {
    expect(await transition('tsx', '/*<t>*/', { t: 'true' }, { t: 'false' }))
      .toMatchInlineSnapshot(`
        {
          "create": [
            [
              "false",
              "#79c0ff",
              [
                0,
                0,
              ],
            ],
          ],
          "delete": [
            [
              "true",
              "#79c0ff",
              [
                0,
                0,
              ],
            ],
          ],
          "retain": [],
        }
      `);
  });

  it('should retain notes when substituting tag', async () => {
    const codez = `(/*<t>*/)=>{}`;
    const transformation = await transition(
      'tsx',
      codez,
      { t: '' },
      { t: 't' },
    );
    expect(transformation).toMatchInlineSnapshot(`
      {
        "create": [
          [
            "t",
            "#ffa657",
            [
              0,
              1,
            ],
          ],
        ],
        "delete": [],
        "retain": [
          [
            "(",
            undefined,
            [
              0,
              0,
            ],
            [
              0,
              0,
            ],
          ],
          [
            ")",
            undefined,
            [
              0,
              2,
            ],
            [
              0,
              1,
            ],
          ],
          [
            "=>",
            "#ff7b72",
            [
              0,
              3,
            ],
            [
              0,
              2,
            ],
          ],
          [
            "{}",
            undefined,
            [
              0,
              5,
            ],
            [
              0,
              4,
            ],
          ],
        ],
      }
    `);
  });
});
