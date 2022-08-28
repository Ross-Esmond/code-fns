import {describe, it, expect} from 'vitest'
import {parse} from './parse'
import {process, transform} from './process'

describe('process', async () => {
  it('should do nothing when there are no tags', async () => {
    const parsed = await parse('() => true', 'tsx')
    expect(await process(parsed)).toEqual(parsed)
  })

  it('should remove tags when there are no subs', async () => {
    const parsed = await parse('(/*< foo >*/) => true', 'tsx')
    const without = await parse('() => true', 'tsx')
    expect(await process(parsed)).toEqual(without)
  })

  it('should replace tags when there is a sub', async () => {
    const parsed = await parse('(/*< foo >*/) => true', 'tsx')
    const subed = await parse('(bar: Type) => true', 'tsx')
    expect(await process(parsed, {subs: {foo: 'bar: Type'}})).toEqual(subed)
  })
})

describe('transform', () => {
  it('should detect keep when there are no changes', async () => {
    const parsed = await parse('5', 'tsx');
    expect(await transform(parsed, {}, {})).toMatchInlineSnapshot(`
      TransformList {
        "language": "tsx",
        "lines": [
          TransformLine {
            "tags": [],
            "tokens": [
              KeepToken {
                "color": "#79c0ff",
                "from": [
                  0,
                  0,
                ],
                "text": "5",
                "to": [
                  0,
                  0,
                ],
                "transform": "keep",
                "type": "constant",
              },
            ],
          },
        ],
      }
    `)
  })

  it('should detect removal of a token', async () => {
    const parsed = await parse('/*<t>*/', 'tsx');
    expect(await transform(parsed, {subs: {t: '5'}}, {})).toMatchInlineSnapshot(`
      TransformList {
        "language": "tsx",
        "lines": [
          TransformLine {
            "tags": [],
            "tokens": [],
          },
        ],
      }
    `)
  })
})
