import {describe, it, expect} from 'vitest'
import {parse} from './parse'

describe('parse', () => {
  it('should parse arrow function', async () => {
    expect(await parse('() => 5', 'tsx')).toMatchInlineSnapshot(`
      RenderList {
        "language": "tsx",
        "lines": [
          RenderLine {
            "tags": [],
            "tokens": [
              RenderToken {
                "color": "",
                "position": [
                  0,
                  0,
                ],
                "tag": undefined,
                "text": "() ",
                "type": "",
              },
              RenderToken {
                "color": "#ff7b72",
                "position": [
                  0,
                  3,
                ],
                "tag": undefined,
                "text": "=>",
                "type": "keyword",
              },
              RenderToken {
                "color": "",
                "position": [
                  0,
                  5,
                ],
                "tag": undefined,
                "text": " ",
                "type": "",
              },
              RenderToken {
                "color": "#79c0ff",
                "position": [
                  0,
                  6,
                ],
                "tag": undefined,
                "text": "5",
                "type": "constant",
              },
            ],
          },
        ],
      }
    `)
  })

  it('should eliminate empty strings', async () => {
    expect(await parse('/* multi\n line*/', 'tsx')).toMatchInlineSnapshot(`
      RenderList {
        "language": "tsx",
        "lines": [
          RenderLine {
            "tags": [],
            "tokens": [
              RenderToken {
                "color": "#8b949e",
                "position": [
                  0,
                  0,
                ],
                "tag": undefined,
                "text": "/* multi",
                "type": "comment",
              },
            ],
          },
          RenderLine {
            "tags": [],
            "tokens": [
              RenderToken {
                "color": "#8b949e",
                "position": [
                  1,
                  0,
                ],
                "tag": undefined,
                "text": " line*/",
                "type": "comment",
              },
            ],
          },
        ],
      }
    `)
  })

  it('should detect comment tags', async () => {
    expect(await parse('(/*< tag >*/) => true', 'tsx')).toMatchInlineSnapshot(`
      RenderList {
        "language": "tsx",
        "lines": [
          RenderLine {
            "tags": [],
            "tokens": [
              RenderToken {
                "color": "",
                "position": [
                  0,
                  0,
                ],
                "tag": undefined,
                "text": "(",
                "type": "",
              },
              RenderToken {
                "color": "#8b949e",
                "position": [
                  0,
                  1,
                ],
                "tag": "tag",
                "text": "/*< tag >*/",
                "type": "comment",
              },
              RenderToken {
                "color": "",
                "position": [
                  0,
                  12,
                ],
                "tag": undefined,
                "text": ") ",
                "type": "",
              },
              RenderToken {
                "color": "#ff7b72",
                "position": [
                  0,
                  14,
                ],
                "tag": undefined,
                "text": "=>",
                "type": "keyword",
              },
              RenderToken {
                "color": "",
                "position": [
                  0,
                  16,
                ],
                "tag": undefined,
                "text": " ",
                "type": "",
              },
              RenderToken {
                "color": "#79c0ff",
                "position": [
                  0,
                  17,
                ],
                "tag": undefined,
                "text": "true",
                "type": "constant",
              },
            ],
          },
        ],
      }
    `)
  })

  it('should get correct text when tag lacks white space', async () => {
    expect(await parse('/*<t>*/', 'tsx')).toMatchInlineSnapshot(`
      RenderList {
        "language": "tsx",
        "lines": [
          RenderLine {
            "tags": [],
            "tokens": [
              RenderToken {
                "color": "#8b949e",
                "position": [
                  0,
                  0,
                ],
                "tag": "t",
                "text": "/*<t>*/",
                "type": "comment",
              },
            ],
          },
        ],
      }
    `)
  })
})
