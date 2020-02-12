import bind from 'bind-decorator'
import { makeStringEnum } from 'wizard-utils'

export const DecorateeType = makeStringEnum(
  'all',
  'class',
  'property',
  'instanceProperty',
  'staticProperty',
  'method',
  'instanceMethod',
  'staticMethod',
  'accessor',
  'instanceAccessor',
  'staticAccessor',
  'getter',
  'instanceGetter',
  'staticGetter',
  'setter',
  'instanceSetter',
  'staticSetter',
)
const Type = DecorateeType

export function getTypeForDisplay(type, plural = false) {
  let camelCaseToSpaces = str => str.replace(/([A-Z])/g, ' $1').toLowerCase()
  switch (type) {
    case Type.class:
      return 'class' + (plural ? 'es' : '')
    case Type.instanceMethod:
    case Type.staticMethod:
    case Type.accessor:
    case Type.instanceAccessor:
    case Type.staticAccessor:
    case Type.getter:
    case Type.instanceGetter:
    case Type.staticGetter:
    case Type.setter:
    case Type.instanceSetter:
    case Type.staticSetter:
      return camelCaseToSpaces(type) + (plural ? 's' : '')
    case Type.property:
    case Type.instanceProperty:
    case Type.staticProperty:
      return camelCaseToSpaces(type).slice(0, -1) + (plural ? 'ies' : 'y')
  }
}

export class Decorator {
  static withArgs = false
  supportedTypes = []
  args

  constructor(bindDecorate = true) {
    if (bindDecorate)
      // In constructor to also bind decorate overrides
      this.decorate = this.decorate.bind(this)
  }

  decorate(...args) {
    let self = this,
      _decorate = (...args) => {
        let type = self.getActualType(...args)
        if (self.doesSupport(type) === false)
          throw self.getUnsupportedDecorateeError(type)
        return self.decorateByType(type, ...args)
      }
    if (this.constructor.withArgs === false)
      return _decorate(...args)
    this.args = args
    return ((...args) => _decorate(...args)).bind(this)
  }

  getActualType(...args) {
    if (args.length === 1 && isConstructor(args[0]))
      return Type.class
    if (args.length === 3 && (isPrototype(args[0]) || isConstructor(args[0])) && `${args[1]}` === args[1]) {
      let isStatic = isConstructor(args[0])
      if (isParameterDescriptor(args[2]))
        return isStatic ? Type.staticProperty : Type.instanceProperty
      if (isMethodDescriptor(args[2]))
        return isStatic ? Type.staticMethod : Type.instanceMethod
      if (isAccessorDescriptor(args[2])) {
        let isGetter = !!args[2].get
        if (isStatic === true && isGetter === true)
          return Type.staticGetter
        if (isStatic === true && isGetter === false)
          return Type.staticSetter
        if (isStatic === false && isGetter === true)
          return Type.instanceGetter
        if (isStatic === false && isGetter === false)
          return Type.instanceSetter
      }
    }
    throw new Error(`Could not understand what ${this.constructor.name} is decorating. Got arguments: [` + args.map(a => `${a}`).join(', ') + ']')
  }

  doesSupport(type) {
    let isTypeSupportedBy = (supported, type) =>
      this.getActualTypesOfType(supported).includes(type)
    return !!this.supportedTypes.find(supported =>
      isTypeSupportedBy(supported, type))
  }

  @bind
  getActualTypesOfType(type) {
    let mergeTypes = (...types) =>
        Array.from(new Set(types.map(this.getActualTypesOfType).flat()))
    switch (type) {
      case Type.all:
        return [type, ...mergeTypes(Type.class, Type.property, Type.method, Type.accessor)]
      case Type.property:
        return [type, Type.instanceProperty, Type.staticProperty]
      case Type.method:
        return [type, Type.instanceMethod, Type.staticMethod]
      case Type.accessor:
        return [type, ...mergeTypes(Type.instanceAccessor, Type.staticAccessor)]
      case Type.instanceAccessor:
        return [type, Type.getter, Type.setter, Type.instanceGetter, Type.instanceSetter]
      case Type.staticAccessor:
        return [type, Type.getter, Type.setter, Type.staticGetter, Type.staticSetter]
      case Type.getter:
        return [type, Type.instanceAccessor, Type.staticAccessor, Type.instanceGetter, Type.staticGetter]
      case Type.setter:
        return [type, Type.instanceAccessor, Type.staticAccessor, Type.instanceSetter, Type.staticSetter]
      default:
        return [type]
    }
  }

  getUnsupportedDecorateeError(type) {
    let message = `${this.constructor.name} does not support decorating ${getTypeForDisplay(type, true)}.`
    if (this.supportedTypes.length) message += `\nIt supports decorating: ${this.supportedTypes.join(', ')}.` 
    return new Error(message)
  }

  decorateByType(type, ...args) {
    switch (type) {
      case Type.class:
        return this.decorateClass(...args)
      case Type.instanceProperty:
        return this.decorateInstanceProperty(...args)
      case Type.instanceMethod:
        return this.decorateInstanceMethod(...args)
      case Type.instanceGetter:
        return this.decorateInstanceGetter(...args)
      case Type.instanceSetter:
        return this.decorateInstanceSetter(...args)
      case Type.staticProperty:
        return this.decorateStaticProperty(...args)
      case Type.staticMethod:
        return this.decorateStaticMethod(...args)
      case Type.staticGetter:
        return this.decorateStaticGetter(...args)
      case Type.staticSetter:
        return this.decorateStaticSetter(...args)
    }
  }

  decorateClass(ctor) { return ctor }
  decorateProperty(protoOrCtor, name, descriptor) { return protoOrCtor }
  decorateInstanceProperty(proto, name, descriptor) {
    return this.decorateProperty(proto, name, descriptor)
  }
  decorateStaticProperty(ctor, name, descriptor) {
    return this.decorateProperty(ctor, name, descriptor)
  }
  decorateMethod(protoOrCtor, name, descriptor) { return protoOrCtor }
  decorateInstanceMethod(proto, name, descriptor) {
    return this.decorateMethod(proto, name, descriptor)
  }
  decorateStaticMethod(ctor, name, descriptor) {
    return this.decorateMethod(ctor, name, descriptor)
  }
  decorateAccessor(protoOrCtor, name, descriptor) { return protoOrCtor }
  decorateInstanceAccessor(proto, name, descriptor) {
    return this.decorateAccessor(proto, name, descriptor)
  }
  decorateStaticAccessor(ctor, name, descriptor) {
    return this.decorateAccessor(ctor, name, descriptor)
  }
  decorateGetter(protoOrCtor, name, descriptor) { return protoOrCtor }
  decorateInstanceGetter(proto, name, descriptor) {
    proto = this.decorateInstanceAccessor(proto, name, descriptor)
    return this.decorateGetter(proto, name, descriptor)
  }
  decorateStaticGetter(ctor, name, descriptor) {
    ctor = this.decorateStaticAccessor(ctor, name, descriptor)
    return this.decorateGetter(ctor, name, descriptor)
  }
  decorateSetter(protoOrCtor, name, descriptor) { return protoOrCtor }
  decorateInstanceSetter(proto, name, descriptor) {
    proto = this.decorateInstanceAccessor(proto, name, descriptor)
    return this.decorateSetter(proto, name, descriptor)
  }
  decorateStaticSetter(ctor, name, descriptor) {
    ctor = this.decorateStaticAccessor(ctor, name, descriptor)
    return this.decorateSetter(ctor, name, descriptor)
  }
}

export class DecoratorWithArgs extends Decorator {
  static withArgs = true
}

function isPrototype(func) {
  return func instanceof Object && !(func instanceof Function)
}

function isConstructor(func) {
  return func instanceof Object && func instanceof Function
}

function isAccessorDescriptor(obj) {
  return isPropertyDescriptor(obj)
    && (!obj.get || obj.get instanceof Function)
    && (!obj.set || obj.set instanceof Function)
}

function isParameterDescriptor(obj) {
  return isPropertyDescriptor(obj)
    && obj.initializer === null
    || (
      typeof obj.initializer === 'function'
      && obj.initializer.name === 'initializer'
    )
}

function isMethodDescriptor(obj) {
  return isPropertyDescriptor(obj)
    && typeof obj.value === 'function'
}

function isPropertyDescriptor(obj) {
  return obj
    && typeof obj.configurable === 'boolean'
    && typeof obj.enumerable === 'boolean'
    && typeof obj.writable === 'boolean' || !obj.writable
}
