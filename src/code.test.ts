import { describe, it, expect } from 'vitest';
import { parse, ready, toString, clean } from './code';

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
