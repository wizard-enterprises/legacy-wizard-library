import { decorate as CachedReturn } from './cached-return'
import { DecorateeType as Type, Decorator } from './abstract'

export class ClassInstanceDecorator extends Decorator {
  supportedTypes = [Type.class]
  instanceDecorators = {}
  decoratedParameters = {}
  instanceDecoratorClass = InstanceDecorator

  constructor(instanceDecorators) {
    super()
    this.instanceDecorators = instanceDecorators || this.instanceDecorators
  }

  decorateClass(ctor) {
    let self = this
    return new Proxy(ctor, {
      construct(target, args) { 
        return new Proxy(Reflect.construct(target, args), {
          get(target, prop) {
            if (self.decoratedParameters.hasOwnProperty(prop) === false)
              return target[prop]
            for (let decorator of self.decoratedParameters[prop])
              target[prop] = decorator.decorateOnInstance(target, prop)
            return target[prop]
          }
        })
      }
    })
  }

  getDecorators() {
    return {
      klass: this.decorate,
      ...Object.entries(this.makeInstanceDecorators())
        .reduce((acc, [name, decorator]) =>
        ({...acc, [name]: decorator.decorate}), {}),
    }
  }

  @CachedReturn
  makeInstanceDecorators() {
    return Object.entries(this.instanceDecorators)
      .reduce((acc, [name, desc]) =>
        ({...acc, [name]: this.makeInstanceDecorator(name, desc)}), {})
  }

  makeInstanceDecorator(name, desc) {
    return new this.instanceDecoratorClass(name, this.getInstanceDelegate())
  }

  @CachedReturn
  getInstanceDelegate() {
    let self = this
    return {
      decorated(decoratorName, name, decoratorInstance) {
        if (self.decoratedParameters[name] === undefined)
          self.decoratedParameters[name] = []
        self.decoratedParameters[name].push(decoratorInstance)
      }
    }
  }
}

export class InstanceDecorator extends Decorator {
  supportedTypes = [Type.instanceMethod, Type.instanceAccessor]
  delegate
  name

  constructor(name, classDecoratorDelegate) {
    super()
    this.name = name
    this.delegate = classDecoratorDelegate
  }

  decorate(...args) {
    let decorated = super.decorate(...args)
    if (this.constructor.withArgs === false) {
      this.reportDecorated(args[1])
      return decorated
    }
    return (proto, name, desc) => {
      let actuallyDecorated = decorated(proto, name, desc)
      this.reportDecorated(name)
      return actuallyDecorated
    }
  }

  reportDecorated(name) {
    this.delegate.decorated(this.name, name, this)
  }

  decorateOnInstance(instance, name) {
    return instance[name]
  }
}