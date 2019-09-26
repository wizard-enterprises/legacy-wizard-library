import {isEqual, isMatchWith, isPlainObject} from 'lodash'

export function assert(boolean, message?, _this: Function = assert) {
  if (!boolean) throw new AssertionError(_this, message || `Expected "${boolean}" to be truthy`)
}

assert.includes = function assertIncludes(a: string | Array<any>, b, message?, _this: Function = assertIncludes) {
  assert(a.includes(b), message || `Expected "${b}" to be included in "${a}"`, _this)
}

assert.identical = function assertIdentical(a, b, message?, _this: Function = assertIdentical) {
  assert(a === b, message || `Expected "${a}" to be identical to "${b}"`, _this)
}

assert.primitiveEqual = function assertPrimitiveEqual(a, b, message?, _this: Function = assertPrimitiveEqual) {
  [a, b] = [a, b].map(x => JSON.stringify(x))
  assert.identical(
    a, b,
    message || `Expected:\n${a}\n\nTo primitively equal:\n${b}`,
    _this,
  )
}

assert.deepEqual = function assertDeepEqual(a, b, message?, _this: Function = assertDeepEqual) {
  assert(isEqual(a, b, customizerForLodashMatchEqual(_this)), message || `Expected:\n${JSON.stringify(a, null, 2)}\n\nTo deeply equal:\n${JSON.stringify(b, null, 2)}`)
}

assert.objectMatches = function assertObjectMatches(a, b, message?, _this: Function = assertObjectMatches) {
  assert(isMatchWith(a, b, customizerForLodashMatchEqual(_this)), message || `Expected:\n${JSON.stringify(a, null, 2)}\n\nTo be matched by:\n${JSON.stringify(b, null, 2)}`)
}

function customizerForLodashMatchEqual(_this) {
  return (a, b) => {
    if (isPlainObject(a) || Array.isArray(a)
      || isPlainObject(b) || Array.isArray(b))
      return undefined 
    else
      return assert.identical(a, b, undefined, _this)
  }
}

assert.not = function assertNot(boolean, message?, _this: Function = assertNot) {
  assert(!boolean, message || `Expected "${boolean}" to be falsey`, _this)
}

assert.jsonParsable = function assertJsonParsable(jsonString: string, message?, _this: Function = assertJsonParsable) {
  try {
    assert(JSON.parse(jsonString) instanceof Object, message, _this)
  } catch (e) {
    throw new AssertionError(_this, message || `Expected string to be JSON-parsable:\n${jsonString}`)
  }
}

class AssertionError extends Error {
  constructor(_this, ...args) {
    super(...args)
    //@ts-ignore
    if (Error.captureStackTrace) Error.captureStackTrace(this, _this)
  }
}
