import { expect } from 'chai'
import { isEmpty, MixedList } from '../../../src/common/MixedList'

describe('MixedList and isEmpty function', () => {
  it('should return true for an empty array', () => {
    const list: MixedList<number> = []
    expect(isEmpty(list)).to.be.true
  })

  it('should return false for a non-empty array', () => {
    const list: MixedList<number> = [1, 2, 3]
    expect(isEmpty(list)).to.be.false
  })

  it('should return true for an empty object', () => {
    const list: MixedList<number> = {}
    expect(isEmpty(list)).to.be.true
  })

  it('should return false for a non-empty object', () => {
    const list: MixedList<number> = { a: 1, b: 2 }
    expect(isEmpty(list)).to.be.false
  })

  it('should handle mixed types in array', () => {
    const list: MixedList<any> = [1, 'string', true]
    expect(isEmpty(list)).to.be.false
  })

  it('should handle mixed types in object', () => {
    const list: MixedList<any> = { a: 1, b: 'string', c: true }
    expect(isEmpty(list)).to.be.false
  })
})