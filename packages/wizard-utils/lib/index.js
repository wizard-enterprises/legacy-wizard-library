'use strict';

let root = {
  jsonStringifyWithEscapedCircularRefs,
}, contextual = Object.entries({
  puppeteer: {
    makeWindowErrorSerializable,
    makeFunctionFromStringified,
  }
}).reduce((acc, [context, utils]) =>
  ({...acc, [context]: {...root, ...utils}}), {})

module.exports = {
  ...root,
  ...contextual,
}

function jsonStringifyWithEscapedCircularRefs(obj) {
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

function makeWindowErrorSerializable(e) {
  let data = JSON.parse(JSON.stringify(e, ['message', 'arguments', 'type', 'name', 'stack'])),
    error = new Error
  for (let key in data)
    error[key] = data[key]
  return error
}

function makeFunctionFromStringified(funcString) {
  if (!funcString.replace) throw new Error(`Can't make function from function string because it's not a string: ${funcString}`)
  funcString = funcString.replace(/^\s*(public|protected|private) /, '')
  if ([
    /^\s*\(/,
    /^\s*(async\s+)?function/,
    /^\s*[\w\d_]+\s*\=\>/,
  ].find(regex => funcString.match(regex)) === undefined) {
    funcString = funcString.match(/^\s*async/)
      ? funcString.replace('async', 'async function')  
      : 'function ' + funcString
  }
  return new Function(`return (${funcString}).apply(window, arguments)`)
}