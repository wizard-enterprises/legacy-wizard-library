class AssertionError extends Error {
  constructor(...args) {
    super(...args)
    //@ts-ignore
    if (Error.captureStackTrace) Error.captureStackTrace(this, AssertionError)
  }
}

export function assertIncludes(a: string | Array<any>, b, message?) {
  assert(a.includes(b), message || `Expected "${b}" to be included in "${a}"`)
}

export function assertPrimitiveEqual(a, b, message?) {
  [a, b] = [a, b].map(x => JSON.stringify(x))
  assertIdentical(
    a, b,
    message || `Expected: ${a}\n To primitively equal to ${b}`
  )
}

export function assertIdentical(a, b, message?) {
  assert(a === b, message || `Expected "${a}" to be identical to "${b}"`)
}

export function assertNot(boolean, message?) {
  assert(!boolean, message || `Expected "${boolean}" to be falsey`)
}

export function assert(boolean, message?) {
  if (!boolean) throw new AssertionError(message || `Expected "${boolean}" to be truthy`)
}