import { decorate as CachedReturn } from './cached-return'
import { DecorateeType as Type, Decorator } from './abstract'
import { getPrototypical } from 'wizard-utils'

const DECORATION_METADATA_KEY = Symbol('WIZARD_DECORATION_METADATA_KEY')
export class ClassInstanceDecorator extends Decorator {
  supportedTypes = [Type.class]
  instanceDecorators = {}
  instanceDecoratorClass = InstanceDecorator

  constructor(instanceDecorators) {
    super()
    this.instanceDecorators = instanceDecorators || this.instanceDecorators
  }

  decorateClass(ctor) {
    let self = this
    return class extends ctor {
      decorateInstance(instance = this) {
        let decoratedMembers = getPrototypical(instance, DECORATION_METADATA_KEY).reduce((acc, decoration) => {
          for (let [prop, decorations] of Object.entries(decoration))
            acc[prop] = [...(acc[prop] ?? []), ...decorations]
          return acc
        }, {})
        self.decorateNewInstance(instance)
        for (let [prop, decorators] of Object.entries(decoratedMembers))
          this.decorateMember(instance, prop, decorators)
        return instance
      }

      decorateMember(instance, prop, decorators) {
        let member = instance[prop]
        for (let decorator of decorators)
          instance[prop] = member = (decorator(instance, prop) ?? member)
      }
    }
  }

  decorateNewInstance(instance) {}

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

  getInstanceDelegate() {
    return {}
  }
}

export class InstanceDecorator extends Decorator {
  supportedTypes = [Type.instanceMethod, Type.instanceAccessor, Type.instanceProperty]
  delegate
  name

  constructor(name, classDecoratorDelegate) {
    super()
    this.name = name
    this.delegate = classDecoratorDelegate
  }

  decorateByType(type, ...args) {
    let [proto, name] = args
    let decorated = super.decorateByType(type, ...args)
    this.registerMetadataOnPrototype(proto, name, args[2])
    return decorated
  }

  registerMetadataOnPrototype(proto, name, desc) {
    if (proto.hasOwnProperty(DECORATION_METADATA_KEY) === false)
      proto[DECORATION_METADATA_KEY] = {}
    let metadata = proto[DECORATION_METADATA_KEY]
    this.registerDecoratorMetadata(metadata, name, desc)
  }

  registerDecoratorMetadata(metadata, name, desc) {
    let decorateeMetadata = metadata[name] = metadata[name] || []
    decorateeMetadata.push((instance, name) => this.decorateOnInstance(instance, name))
  }


  decorateOnInstance(instance, name) {
    return instance[name]
  }
}