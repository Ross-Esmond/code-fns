import { describe, it, expect } from 'vitest';
import {
  parse,
  tokenColors,
  substitute,
  transition,
  ready,
  toString,
} from './code';

describe('code', () => {
  it('should stringify', async () => {
    await ready();
    expect(toString(parse('tsx', 'true'))).toEqual('true');
  });

  it('should parse', async () => {
    await ready();
    expect(parse('tsx', 'true')).toMatchInlineSnapshot(`
      {
        "chars": [
          {
            "char": "t",
            "classList": [
              "pl-c1",
            ],
            "token": [
              0,
              4,
            ],
          },
          {
            "char": "r",
            "classList": [
              "pl-c1",
            ],
            "token": [
              1,
              4,
            ],
          },
          {
            "char": "u",
            "classList": [
              "pl-c1",
            ],
            "token": [
              2,
              4,
            ],
          },
          {
            "char": "e",
            "classList": [
              "pl-c1",
            ],
            "token": [
              3,
              4,
            ],
          },
        ],
        "language": "tsx",
      }
    `);
  });

  it('should color tokens', async () => {
    await ready();
    expect(tokenColors(['tsx', '() => true'])).toMatchInlineSnapshot(`
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
    await ready();
    expect(tokenColors(substitute(['tsx', '/*<t>*/'], { t: 'true' }))).toEqual(
      tokenColors(['tsx', 'true']),
    );
  });

  it('should keep tags', async () => {
    await ready();
    expect(tokenColors(substitute(['tsx', '/*<t>*/'], {}))).toEqual(
      tokenColors(['tsx', '/*<t>*/']),
    );
  });

  it('should transition', async () => {
    await ready();
    expect(transition(['tsx', '/*<t>*/'], { t: 'true' }, { t: 'false' }))
      .toMatchInlineSnapshot(`
        {
          "create": [
            [
              "false",
              [
                0,
                0,
              ],
              "#79c0ff",
            ],
          ],
          "delete": [
            [
              "true",
              [
                0,
                0,
              ],
              "#79c0ff",
            ],
          ],
          "retain": [],
        }
      `);
  });

  it('should retain nodes when substituting tag', async () => {
    await ready();
    const codez = `(/*<t>*/)`;
    const transformation = transition(['tsx', codez], { t: '' }, { t: 't' });
    expect(transformation).toMatchInlineSnapshot(`
      {
        "create": [
          [
            "t",
            [
              0,
              1,
            ],
            "#c9d1d9",
          ],
        ],
        "delete": [],
        "retain": [
          [
            "(",
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
            [
              0,
              1,
            ],
            [
              0,
              2,
            ],
          ],
        ],
      }
    `);
  });
});

describe('docs', () => {
  it('should print substitution', async () => {
    await ready();

    const code = `(/*< params >*/) => { }`;
    const subbed = substitute(['tsx', code], { params: 'input: any' });
    expect(toString(subbed)).toEqual('(input: any) => { }');
  });

  it('should move token', async () => {
    await ready();
    expect(transition(['tsx', '/*<t>*/true'], { t: '' }, { t: '    ' }))
      .toMatchInlineSnapshot(`
        {
          "create": [
            [
              "    ",
              [
                0,
                0,
              ],
            ],
          ],
          "delete": [],
          "retain": [
            [
              "true",
              [
                0,
                0,
              ],
              [
                0,
                4,
              ],
              "#79c0ff",
            ],
          ],
        }
      `);
  });
});
