import { describe, it, expect } from 'vitest';
import { parse, substitute, transition, ready, toString, clean } from './code';

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
            "sections": [],
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
            "sections": [],
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
            "sections": [],
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
            "sections": [],
            "token": [
              3,
              4,
            ],
          },
        ],
        "language": "tsx",
        "lines": [
          {
            "tags": [],
          },
        ],
      }
    `);
  });

  it('should mark next lines', async () => {
    await ready();
    const code = '//: next-line tag\nl;';
    expect(parse('tsx', code).lines).toMatchInlineSnapshot(`
      [
        {
          "tags": [],
        },
        {
          "tags": [
            "tag",
          ],
        },
      ]
    `);
  });

  it('should mark this lines', async () => {
    await ready();
    const code = 'l; //: this-line tag';
    expect(parse('tsx', code).lines).toMatchInlineSnapshot(`
      [
        {
          "tags": [
            "tag",
          ],
        },
      ]
    `);
  });

  it('should mark tag blocks', async () => {
    await ready();
    const code = 'a //<< tag\nb\n//>>';
    expect(parse('tsx', code).lines).toMatchInlineSnapshot(`
      [
        {
          "tags": [],
        },
        {
          "tags": [
            "tag",
          ],
        },
        {
          "tags": [
            "tag",
          ],
        },
      ]
    `);
  });

  it('should mark nested tag blocks', async () => {
    await ready();
    const code = '//<<a\n//<<b\nl\n//>>\n//>>';
    expect(parse('tsx', code).lines).toMatchInlineSnapshot(`
      [
        {
          "tags": [],
        },
        {
          "tags": [
            "a",
          ],
        },
        {
          "tags": [
            "a",
            "b",
          ],
        },
        {
          "tags": [
            "a",
            "b",
          ],
        },
        {
          "tags": [
            "a",
          ],
        },
      ]
    `);
  });

  it('should mark section characters', async () => {
    await ready();
    const code = '/*<<s*/t/*>>*/';
    expect(clean(parse('tsx', code)).chars).toMatchInlineSnapshot(`
      [
        {
          "char": "t",
          "classList": [
            "pl-smi",
          ],
          "sections": [
            "s",
          ],
          "token": [
            0,
            1,
          ],
        },
      ]
    `);
  });

  it('should mark nested section characters', async () => {
    await ready();
    const code = '/*<<u*/a/*<<v*/b/*>>*/c/*>>*/';
    expect(clean(parse('tsx', code)).chars.map(({ sections }) => sections))
      .toMatchInlineSnapshot(`
      [
        [
          "u",
        ],
        [
          "v",
          "u",
        ],
        [
          "u",
        ],
      ]
    `);
  });
});

describe('utils', () => {
  it('should replace tags', async () => {
    await ready();
    expect(toString(substitute(['tsx', '/*<t>*/'], { t: 'true' }))).toEqual(
      toString(parse('tsx', 'true')),
    );
  });

  it('should keep tags', async () => {
    await ready();
    expect(toString(substitute(['tsx', '/*<t>*/'], {}))).toEqual(
      toString(parse('tsx', '/*<t>*/')),
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

describe('clean', () => {
  it('should remove next-line tags', async () => {
    await ready();
    const code = `//: next-line t\nl`;
    expect(clean(parse('tsx', code))).toMatchInlineSnapshot(`
      {
        "chars": [
          {
            "char": "l",
            "classList": [
              "pl-smi",
            ],
            "sections": [],
            "token": [
              0,
              1,
            ],
          },
        ],
        "language": "tsx",
        "lines": [
          {
            "number": 1,
            "tags": [
              "t",
            ],
          },
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
