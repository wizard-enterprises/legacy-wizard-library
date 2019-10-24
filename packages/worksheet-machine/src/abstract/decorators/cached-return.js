import { Decorator, DecorateeType as Type } from './abstract'

const INSTANCE = Symbol('cached-return')
const CACHED = Symbol('cached-return:cached')

export class CachedReturn extends Decorator {
  supportedTypes = [Type.class, Type.method, Type.getter]

  decorateClass(ctor) {
    let singletonProxyHandler = {
      construct: (target, args) => {
        return this.getSingletonCtor(target)
      }
    }
    let proxy = new Proxy(ctor, singletonProxyHandler)
    Object.defineProperty(proxy, 'getInstance', {
      value: () => new proxy,
    })
    return proxy
  }

  getSingletonCtor(ctor) {
    return ctor[INSTANCE] =
      ctor[INSTANCE] instanceof ctor
        ? ctor[INSTANCE]
        : new ctor
  }

  decorateMethod(proto, name, descriptor) {
    if (!proto[INSTANCE]) proto[INSTANCE] = {}
    if (!proto[CACHED]) proto[CACHED] = []
    descriptor.value = this.getCachedMethod(proto, name, descriptor)
  }
  
  getCachedMethod(proto, name, descriptor) {
    let method = descriptor.value
    return () =>
      proto[INSTANCE][name] =
      proto[CACHED].includes(name)
      ? proto[INSTANCE][name]
      : proto[CACHED].push(name) && method()
  }
        
  decorateGetter(protoOrCtor, name, descriptor) {
    if (!protoOrCtor[INSTANCE]) protoOrCtor[INSTANCE] = {}
    if (!protoOrCtor[CACHED]) protoOrCtor[CACHED] = []
    descriptor.get = this.getCachedGetter(protoOrCtor, name, descriptor)
  }

  getCachedGetter(protoOrCtor, name, descriptor) {
    let getter = descriptor.get
    return () =>
      protoOrCtor[INSTANCE][name] =
        protoOrCtor[CACHED].includes(name + 'Getter')
          ? protoOrCtor[INSTANCE][name]
          : protoOrCtor[CACHED].push(name + 'Getter') && getter()
  }
}

export const decorate = (new CachedReturn).decorate