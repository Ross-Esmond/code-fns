import {describe, it, expect} from 'vitest'
import {parse, transform} from './parse'

describe('parse', () => {
  it('should parse arrow function', async () => {
    expect(await parse('() => 5', 'tsx')).toMatchInlineSnapshot(`
      [
        [
          [
            "() ",
          ],
          [
            "=>",
            "#ff7b72",
          ],
          [
            " ",
          ],
          [
            "5",
            "#79c0ff",
          ],
        ],
      ]
    `)
  })

  it('should eliminate empty strings', async () => {
    expect(await parse('/* multi\n line*/', 'tsx')).toMatchInlineSnapshot(`
      [
        [
          [
            "/* multi",
            "#8b949e",
          ],
        ],
        [
          [
            " line*/",
            "#8b949e",
          ],
        ],
      ]
    `)
  })
})

describe('transform', () => {
  it('should detect an edit', async () => {
    expect(await transform('() => 5', '() => 6', 'tsx')).toMatchInlineSnapshot(`
      [
        [
          [
            "K",
            "(",
          ],
          [
            "K",
            ")",
          ],
          [
            "K",
            " ",
          ],
          [
            "K",
            "=>",
            "#ff7b72",
          ],
          [
            "K",
            " ",
          ],
          [
            "D",
            "5",
            "#79c0ff",
          ],
          [
            "C",
            "6",
            "#79c0ff",
          ],
        ],
      ]
    `)
  })

  it('should detect a token change', async () => {
    expect(await transform('() => five', '() => true', 'tsx')).toMatchInlineSnapshot(`
      [
        [
          [
            "K",
            "(",
          ],
          [
            "K",
            ")",
          ],
          [
            "K",
            " ",
          ],
          [
            "K",
            "=>",
            "#ff7b72",
          ],
          [
            "K",
            " ",
          ],
          [
            "D",
            "five",
            "#c9d1d9",
          ],
          [
            "C",
            "true",
            "#79c0ff",
          ],
        ],
      ]
    `)
  })

  it('should detect a new token', async () => {
    expect(await transform('() => 5', '(five) => 5', 'tsx')).toMatchInlineSnapshot(`
      [
        [
          [
            "K",
            "(",
          ],
          [
            "D",
            ")",
          ],
          [
            "C",
            "five",
          ],
          [
            "D",
            " ",
          ],
          [
            "C",
            ")",
          ],
          [
            "D",
            "=>",
            "#ff7b72",
          ],
          [
            "C",
            " ",
            undefined,
          ],
          [
            "D",
            " ",
          ],
          [
            "C",
            "=>",
          ],
          [
            "D",
            "5",
            "#79c0ff",
          ],
          [
            "C",
            " ",
            undefined,
          ],
        ],
      ]
    `)
  })
})
