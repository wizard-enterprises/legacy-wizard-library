import { Test, TestSuite } from 'polymorphic-tests'
import { DecorateeType } from './abstract'

export class BaseDecoratorSuite extends TestSuite {
  decoratorClass

  before(t) {
    this.decorator = new this.decoratorClass
  }
  get decorate() {
    return this.decorator.decorate
  }
}

export class DecoratorSuite extends BaseDecoratorSuite {
  @Test() 'throw when decorating class if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.class, 'classes', () => {
      @this.decorate
      class C { }
    })
  }
  
  @Test() 'throw when decorating instance property if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.instanceProperty, 'instance properties', () => {
      class C {
        @this.decorate
        x = 5
      }
    })
  }
  
  @Test() 'throw when decorating instance method if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.instanceMethod, 'instance methods', () => {
      class C {
        @this.decorate
        x() {}
      }
    })
  }

  @Test() 'throw when decorating instance getter if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.instanceGetter, 'instance getters', () => {
      class C {
        @this.decorate
        get x() { return 5 }
      }
    })
  }

  @Test() 'throw when decorating instance setter if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.instanceSetter, 'instance setters', () => {
      class C {
        @this.decorate
        set x(x) { }
      }
    })
  }

  @Test() 'throw when decorating static property if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.staticProperty, 'static properties', () => {
      class C {
        @this.decorate
        static x = 5
      }
    })
  }

  @Test() 'throw when decorating static method if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.staticMethod, 'static methods', () => {
      class C {
        @this.decorate
        static x() { }
      }
    })
  }

  @Test() 'throw when decorating static getter if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.staticGetter, 'static getters', () => {
      class C {
        @this.decorate
        static get x() { }
      }
    })
  }

  @Test() 'throw when decorating static setter if unsupported'(t) {
    this.unsupportedTypeTest(t, DecorateeType.staticSetter, 'static setters', () => {
      class C {
        @this.decorate
        static set x(x) { }
      }
    })
  }
  
  unsupportedTypeTest(t, type, typeDescription, declareSuite) {
    if (this.decorator.doesSupport(type))
      return
    t.expect(declareSuite).to.throw(this.getUnsupportedDecorateeError(typeDescription))
  }

  getUnsupportedDecorateeError(unsupportedTypeDescription) {
    let e = `${this.decoratorClass.name} does not support decorating ${unsupportedTypeDescription}.`
    if (this.decorator.supportedTypes.length)
      e += `\nIt supports decorating: ${this.decorator.supportedTypes.join(', ')}.`
    return e
  }
}