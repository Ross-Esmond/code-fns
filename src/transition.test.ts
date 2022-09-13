import { describe, it, expect } from 'vitest';
import { parse, toString } from './code';
import { substitute, transition } from './transition';

describe('utils', () => {
  it('should replace tags', async () => {
    expect(
      toString(await substitute(await parse('tsx', '/*<t>*/'), { t: 'true' })),
    ).toEqual(toString(await parse('tsx', 'true')));
  });

  it('should keep tags', async () => {
    expect(
      toString(await substitute(await parse('tsx', '/*<t>*/'), {})),
    ).toEqual(toString(await parse('tsx', '/*<t>*/')));
  });

  it('should transition', async () => {
    expect(
      await transition(
        await parse('tsx', '/*<t>*/'),
        { t: 'true' },
        { t: 'false' },
      ),
    ).toMatchInlineSnapshot(`
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
              "provinance": "delete",
              "sections": [],
              "token": "true",
            },
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
              "provinance": "create",
              "sections": [],
              "token": "false",
            },
          ],
        }
      `);
  });

  it('should retain nodes when substituting tag', async () => {
    const codez = `(/*<t>*/)`;
    const transformation = await transition(
      await parse('tsx', codez),
      { t: '' },
      { t: 't' },
    );
    expect(transformation).toMatchInlineSnapshot(`
      {
        "language": "tsx",
        "tokens": [
          {
            "background": undefined,
            "classList": [],
            "color": undefined,
            "location": [
              0,
              0,
            ],
            "prior": [
              0,
              0,
            ],
            "provinance": "retain",
            "sections": [],
            "token": "(",
          },
          {
            "background": undefined,
            "classList": [
              "pl-smi",
            ],
            "color": "#c9d1d9",
            "location": [
              0,
              1,
            ],
            "provinance": "create",
            "sections": [],
            "token": "t",
          },
          {
            "background": undefined,
            "classList": [],
            "color": undefined,
            "location": [
              0,
              2,
            ],
            "prior": [
              0,
              1,
            ],
            "provinance": "retain",
            "sections": [],
            "token": ")",
          },
        ],
      }
    `);
  });
});

describe('docs', () => {
  it('should print substitution', async () => {
    const code = `(/*< params >*/) => { }`;
    const subbed = await substitute(await parse('tsx', code), {
      params: 'input: any',
    });
    expect(toString(subbed)).toEqual('(input: any) => { }');
  });

  it('should move token', async () => {
    expect(
      await transition(
        await parse('tsx', '/*<t>*/true'),
        { t: '' },
        { t: '    ' },
      ),
    ).toMatchInlineSnapshot(`
        {
          "language": "tsx",
          "tokens": [
            {
              "background": undefined,
              "classList": [],
              "color": undefined,
              "location": [
                0,
                0,
              ],
              "provinance": "create",
              "sections": [],
              "token": "    ",
            },
            {
              "background": undefined,
              "classList": [
                "pl-c1",
              ],
              "color": "#79c0ff",
              "location": [
                0,
                4,
              ],
              "prior": [
                0,
                0,
              ],
              "provinance": "retain",
              "sections": [],
              "token": "true",
            },
          ],
        }
      `);
  });
});
