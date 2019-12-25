import _getCallerFile from 'get-caller-file'

export const getCallerFile = _getCallerFile

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

export function makeFunctionFromStringified(funcString) {
  if (!funcString.replace) throw new Error(`Can't make function from function string because it's not a string: ${funcString}`)
  funcString = funcString
    .replace(/(public|protected|private) /, '')
    .replace(/^\s*export /, '')
    .replace(/^\s*(module\.)?exports = /, '')
  if ([
    /^\s*(async\s+?)?\(/,
    /^\s*(async\s+?)?function/,
    /^\s*[\w\d_]+\s*\=\>/,
  ].find(regex => funcString.match(regex)) === undefined) {
    funcString = funcString.match(/^\s*async/)
      ? funcString.replace('async', 'async function')  
      : 'function ' + funcString
  }
  return new Function(`return (${funcString}).apply(this.window || this.global || this || null, arguments)`)
}
