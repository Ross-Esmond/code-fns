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
                "tag": undefined,
                "text": "() ",
                "type": "",
              },
              RenderToken {
                "color": "#ff7b72",
                "tag": undefined,
                "text": "=>",
                "type": "keyword",
              },
              RenderToken {
                "color": "",
                "tag": undefined,
                "text": " ",
                "type": "",
              },
              RenderToken {
                "color": "#79c0ff",
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
                "tag": undefined,
                "text": "(",
                "type": "",
              },
              RenderToken {
                "color": "#8b949e",
                "tag": "tag",
                "text": "/*< tag >*/",
                "type": "comment",
              },
              RenderToken {
                "color": "",
                "tag": undefined,
                "text": ") ",
                "type": "",
              },
              RenderToken {
                "color": "#ff7b72",
                "tag": undefined,
                "text": "=>",
                "type": "keyword",
              },
              RenderToken {
                "color": "",
                "tag": undefined,
                "text": " ",
                "type": "",
              },
              RenderToken {
                "color": "#79c0ff",
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
})
