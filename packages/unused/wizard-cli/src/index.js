import { DecoratorWithArgs, DecorateeType as Type } from 'wizard-decorators'
import { makeStringEnum } from 'wizard-utils'

class CommandDecorator extends DecoratorWithArgs {
  supportedTypes = [Type.class]
  name
  set args(args) {
    this.name = args[0]
  }

  // decorateClass(ctor) {
  //   return class DecoratedCommand extends ctor {

  //   }
  // }
}

class ArgsDecorator extends DecoratorWithArgs {
  supportedTypes = [Type.instanceMethod]

  decorateInstanceMethod(proto, name, descriptor) {
    proto.runArgs = this.args[0].map(o => Object.entries(o)[0])
  }
}

export const command = (new CommandDecorator).decorate
export const args = (new ArgsDecorator).decorate

export class CliCommand {
  validateAndParseArgs(...args) {
    let parser = new ArgsParser(this.runArgs)
    return parser.parse(...args)
  }
}

let ArgTypes = makeStringEnum(
  'any',
  'boolean',
  'string',
  'number',
  'object',
  'array',
)

class ArgsParser {
  constructor(argDescriptors = []) {
    this.argDescriptors = argDescriptors
  }

  parse(...args) {
    console.log('ArgsParser parsing', this.argDescriptors, args)
    return this.argDescriptors
      .map(([name, desc], i) => {
        let type = this.getType(desc, i === this.argDescriptors.length - 1)
        switch (type) {
          case ArgTypes.any:
          case ArgTypes.string: return this.parseString(args[i])
          case ArgTypes.boolean:
          case ArgTypes.object: return JSON.parse(this.parseString(args[i]))
          case ArgTypes.array: this.parseArrayArg(args[i])
          case ArgTypes.number: return Number(args[i])
        }
      })
  }

  getType(rawType, isLast) {
    let r = rawType
    if (r === '*') return ArgTypes.any
    if (r === Number(r)) return ArgTypes.number
    if (r === true || r === false) return ArgTypes.boolean
    if (r === `${r}`) return ArgTypes.string
    if (r instanceof Object && !(r instanceof Array)) return ArgTypes.object 
    if (r instanceof Array)
      if ()
    else
      return ArgTypes.array
  }

  parseString(string) {
    return this.isWrappedInQuotes(string) ? JSON.parse(string) : string
  }

  parseArrayArg(arrayArg) {

  }

  isJsonObjOrArray(string) {
    return (
      this.isWrappedWith(string, '{', '}')
      || this.isWrappedWith(string, '[', ']')
    ) && this.isJsonParsable(string)
  }

  isWrappedWith(string, start, end) {
    if (end === undefined) end = start
    return string === `${string}`
      && string.startsWith(start)
      && string.endsWith(end)
  }

  isWrappedInQuotes(string) {
    return (
      this.isWrappedWith(string, "'")
      || this.isWrappedWith(string, '"') 
    ) && this.isJsonParsable(string)
  }

  isJsonParsable(string) {
    try {
      JSON.parse(string)
      return true
    } catch (e) {
      return false
    }
  }
}