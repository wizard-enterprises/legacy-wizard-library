export function makeStringEnum<T extends string = string>(
  ...members: string[]
): {T: T} {
  return members.reduce((acc, member) => ({...acc, [member]: member}), {}) as {T: T}
}

export function jsonStringifyWithEscapedCircularRefs(obj: Object) {
  return JSON.stringify(obj, (() => {
    let seen = new WeakSet()
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value))
          return `[circular: ${key}]`
        seen.add(value)
      }
      return value
    }
  })())
}
