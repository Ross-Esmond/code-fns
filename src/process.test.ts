import {describe, it, expect} from 'vitest'
import {parse} from './parse'
import {process} from './process'

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
