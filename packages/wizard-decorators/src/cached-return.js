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
    descriptor.value = this.getCachedMethod(proto, name, descriptor)
  }
  
  getCachedMethod(proto, name, descriptor) {
    let method = descriptor.value
    return function(...args) {
      if (!this[CACHED]) this[CACHED] = {}
      if (this[CACHED][name] === undefined) this[CACHED][name] = {
        ran: false,
      }
      if (this[CACHED][name].ran === false) this[CACHED][name] = {
        ran: true,
        value: method.call(this, ...args),
      }
      return this[CACHED][name].value
    }
  }
        
  decorateGetter(protoOrCtor, name, descriptor) {
    descriptor.get = this.getCachedGetter(protoOrCtor, name, descriptor)
  }

  getCachedGetter(protoOrCtor, name, descriptor) {
    let getter = descriptor.get
    return function() {
      if (!this[CACHED]) this[CACHED] = {}
      if (this[CACHED][name] === undefined) this[CACHED][name] = {
        ran: false,
      }
      if (this[CACHED][name].ran === false) this[CACHED][name] = {
        ran: true,
        value: getter.call(this),
      }
      return this[CACHED][name].value
    }
  }
}

export const decorate = (new CachedReturn).decorate