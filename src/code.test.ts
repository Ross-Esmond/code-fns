import { describe, it, expect } from 'vitest';
import { parse, process, toString, addAlternative } from './code';

describe('code', () => {
  it('should stringify', async () => {
    expect(toString(await parse('tsx', 'true'))).toEqual('true');
  });

  it('should parse', async () => {
    expect(await parse('tsx', 'true')).toMatchInlineSnapshot(`
      {
        "chars": [
          {
            "char": "t",
            "classList": [
              "pl-c1",
            ],
            "isSpecial": false,
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
            "isSpecial": false,
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
            "isSpecial": false,
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
            "isSpecial": false,
            "sections": [],
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

  it('should mark tag blocks', async () => {
    const code = '//<< tag\na\n//>>';
    const parsed = await parse('tsx', code);
    const processed = process(parsed);
    expect(processed.chars.map(({ sections }) => sections))
      .toMatchInlineSnapshot(`
      [
        [
          [
            "tag",
          ],
        ],
        [
          [
            "tag",
          ],
        ],
      ]
    `);
  });

  it('should mark nested tag blocks', async () => {
    const code = '//<< a\n//<< b\nc\n//>>\n//>>';
    const parsed = await parse('tsx', code);
    const processed = process(parsed);
    expect(processed.chars.map(({ sections }) => sections))
      .toMatchInlineSnapshot(`
      [
        [
          [
            "b",
          ],
          [
            "a",
          ],
        ],
        [
          [
            "b",
          ],
          [
            "a",
          ],
        ],
      ]
    `);
  });

  it('should mark section characters', async () => {
    const code = '/*<<s*/t/*>>*/';
    expect(process(await parse('tsx', code), {}).chars).toMatchInlineSnapshot(`
      [
        {
          "char": "t",
          "classList": [
            "pl-smi",
          ],
          "isSpecial": false,
          "sections": [
            [
              "s",
            ],
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
    const code = '/*<<u*/a/*<<v*/b/*>>*/c/*>>*/';
    expect(
      process(await parse('tsx', code)).chars.map(({ sections }) => sections),
    ).toMatchInlineSnapshot(`
        [
          [
            [
              "u",
            ],
          ],
          [
            [
              "v",
            ],
            [
              "u",
            ],
          ],
          [
            [
              "u",
            ],
          ],
        ]
      `);
  });

  it('should mark special tags', async () => {
    const code = '/*<t>*/code';
    expect((await parse('tsx', code)).chars.map(({ isSpecial }) => isSpecial))
      .toMatchInlineSnapshot(`
      [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
      ]
    `);
  });

  it('should mark alternatives', async () => {
    const code = '(/*<t>*/)';
    const parsed = await parse('tsx', code);
    const alt = await addAlternative(parsed, 't', 'b', '5');
    expect(alt.chars.map(({ sections }) => sections)).toMatchInlineSnapshot(`
      [
        [],
        [
          [
            "t",
            "b",
          ],
        ],
        [],
      ]
    `);
  });

  it('should remove special characters', async () => {
    const code = '/*<t>*/5';
    const parsed = await parse('tsx', code);
    const alt = await addAlternative(parsed, 't', 'b', '-');
    const processed = process(alt, {});
    expect(processed.chars).toMatchInlineSnapshot(`
      [
        {
          "char": "5",
          "classList": [
            "pl-c1",
          ],
          "isSpecial": false,
          "sections": [],
          "token": [
            0,
            1,
          ],
        },
      ]
    `);
  });

  it('should replace tags', async () => {
    const code = '(/*<t>*/)';
    const parsed = await parse('tsx', code);
    const alt = await addAlternative(parsed, 't', 'b', '1');
    const processed = process(alt, { t: 'b' });
    expect(processed.chars.reduce((str, { char }) => str + char, '')).toEqual(
      '(1)',
    );
  });

  it('should allow for hiding sections', async () => {
    const code = '/*<<t*/-/*>>*/1';
    const parsed = await parse('tsx', code);
    const processed = process(parsed, { t: false });
    expect(processed.chars.reduce((str, { char }) => str + char, '')).toEqual(
      '1',
    );
  });

  it('should allow for keeping sections', async () => {
    const code = '/*<<t*/-/*>>*/1';
    const parsed = await parse('tsx', code);
    const processed = process(parsed, { t: true });
    expect(processed.chars.reduce((str, { char }) => str + char, '')).toEqual(
      '-1',
    );
  });

  it('should keep sections by default', async () => {
    const code = '/*<<t*/-/*>>*/1';
    const parsed = await parse('tsx', code);
    const processed = process(parsed, {});
    expect(processed.chars.reduce((str, { char }) => str + char, '')).toEqual(
      '-1',
    );
  });

  it('should mark next line', async () => {
    const code = '//: next-line tag\na\n';
    const parsed = await parse('tsx', code);
    const processed = process(parsed, {});
    expect(processed.chars.map(({ sections }) => sections))
      .toMatchInlineSnapshot(`
      [
        [
          [
            "tag",
          ],
        ],
        [
          [
            "tag",
          ],
        ],
      ]
    `);
  });

  it('should mark this line', async () => {
    const code = 'a//: this-line tag\n';
    const parsed = await parse('tsx', code);
    const processed = process(parsed, {});
    expect(processed.chars.map(({ sections }) => sections))
      .toMatchInlineSnapshot(`
      [
        [
          [
            "tag",
          ],
        ],
        [
          [
            "tag",
          ],
        ],
      ]
    `);
  });
});
