import { SubSuite, Test, TestSuite, Suite } from 'polymorphic-tests'
import { Decorator, DecorateeType } from './abstract'

export class DecoratorSuite extends TestSuite {
  decoratorClass

  before(t) {
    this.decorator = new this.decoratorClass
    this.decorate = this.decorator.decorate
  }


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

@Suite() export class Decorators extends TestSuite {}

@SubSuite(Decorators) class DecoratorFoundation extends TestSuite {}

class NoSupportDecorator extends Decorator {}
@SubSuite(DecoratorFoundation) class NoSupportDecoratorTest extends DecoratorSuite {
  decoratorClass = NoSupportDecorator
}

class AllSupportDecorator extends Decorator {
  supportedTypes = Object.keys(DecorateeType)
}
@SubSuite(DecoratorFoundation) class AllSupportDecoratorTest extends DecoratorSuite {
  decoratorClass = AllSupportDecorator
}

class SomeSupportDecorator extends Decorator {
  supportedTypes = [DecorateeType.class, DecorateeType.instanceMethod]

  decorate(...args) {
    super.decorate(...args)
    this.ran = true
  }
}
@SubSuite(DecoratorFoundation) class SomeSupportDecoratorTest extends DecoratorSuite {
  decoratorClass = SomeSupportDecorator

  @Test() 'runs decorator on supported type'(t) {
    @this.decorate
    class C { }
    t.expect(this.decorator.ran).to.equal(true)
  }
}

class SupportTypeOverridesDecorator extends Decorator {
  supportedTypes = ['class', 'property', 'method', 'accessor']
  calls = []
  decorateClass(...args) {
    super.decorateClass(...args)
    this.calls.push('decorateClass')
  }
  decorateProperty(...args) {
    super.decorateProperty(...args)
    this.calls.push('decorateProperty')
  }
  decorateInstanceProperty(...args) {
    super.decorateInstanceProperty(...args)
    this.calls.push('decorateInstanceProperty')
  }
  decorateStaticProperty(...args) {
    super.decorateStaticProperty(...args)
    this.calls.push('decorateStaticProperty')
  }
  decorateMethod(...args) {
    super.decorateMethod(...args)
    this.calls.push('decorateMethod')
  }
  decorateInstanceMethod(...args) {
    super.decorateInstanceMethod(...args)
    this.calls.push('decorateInstanceMethod')
  }
  decorateStaticMethod(...args) {
    super.decorateStaticMethod(...args)
    this.calls.push('decorateStaticMethod')
  }
  decorateAccessor(...args) {
    super.decorateAccessor(...args)
    this.calls.push('decorateAccessor')
  }
  decorateInstanceAccessor(...args) {
    super.decorateInstanceAccessor(...args)
    this.calls.push('decorateInstanceAccessor')
  }
  decorateStaticAccessor(...args) {
    super.decorateStaticAccessor(...args)
    this.calls.push('decorateStaticAccessor')
  }
  decorateGetter(...args) {
    super.decorateGetter(...args)
    this.calls.push('decorateGetter')
  }
  decorateInstanceGetter(...args) {
    super.decorateInstanceGetter(...args)
    this.calls.push('decorateInstanceGetter')
  }
  decorateStaticGetter(...args) {
    super.decorateStaticGetter(...args)
    this.calls.push('decorateStaticGetter')
  }
  decorateSetter(...args) {
    super.decorateSetter(...args)
    this.calls.push('decorateSetter')
  }
  decorateInstanceSetter(...args) {
    super.decorateInstanceSetter(...args)
    this.calls.push('decorateInstanceSetter')
  }
  decorateStaticSetter(...args) {
    super.decorateStaticSetter(...args)
    this.calls.push('decorateStaticSetter')
  }
}
@SubSuite(DecoratorFoundation) class SupportTypeOverrides extends DecoratorSuite {
  decoratorClass = SupportTypeOverridesDecorator

  // @Test() 'should allow all from just broadest types'(t) {
  //   @this.decorate class C {
  //     @this.decorate y = 5
  //     @this.decorate static y = 5
  //     @this.decorate m() {}
  //     @this.decorate static m() {}
  //     @this.decorate get x() {}
  //     @this.decorate set x(x) {}
  //     @this.decorate static get x() {}
  //     @this.decorate static set x(x) {}
  //   }
  //   let expectedCallCount =
  //     1 // class
  //     + 2 // property
  //     + 1 + 1 // instance and static property
  //     + 2 // method
  //     + 1 + 1 // instance and static method
  //     + 4 // accessor
  //     + 2 // instance accessor
  //     + 1 + 1// instance getter and setter
  //     + 2 // static accessor
  //     + 1 + 1// static getter and setter
  //   t.expect(this.decorator.calls.length).to.equal(expectedCallCount, [...this.decorator.decorated, '\t', ...this.decorator.calls])
  // }
  oldT = null
  before(t) {
    super.before(t)
    this.oldT = t
    t.expectDecoratorCalls = (...calls) =>
      t.expect(this.decorator.calls)
        .to.deep.equal(this.expectedCalls(...calls))
  }

  @Test() 'allow class'(t) {
    @this.decorate class C {}
    t.expectDecoratorCalls('class')
  }

  @Test() 'allow properties'(t) {
    class C {
      @this.decorate x = 5
      @this.decorate static x = 5
    }
    t.expectDecoratorCalls('property', 'instanceProperty', 'property', 'staticProperty')
  }

  @Test() 'allow methods'(t) {
    class C {
      @this.decorate x() {}
      @this.decorate static x() {}
    }
    t.expectDecoratorCalls('method', 'instanceMethod', 'method', 'staticMethod')
  }

  @Test() 'allow getters'(t) {
    class C {
      @this.decorate get x() {}
      @this.decorate static get x() {}
    }
    t.expectDecoratorCalls(
      'accessor', 'instanceAccessor', 'getter', 'instanceGetter',
      'accessor', 'staticAccessor', 'getter', 'staticGetter',
    )
  }

  @Test() 'allow setters'(t) {
    class C {
      @this.decorate set x(x) {}
      @this.decorate static set x(x) {}
    }
    t.expectDecoratorCalls(
      'accessor', 'instanceAccessor', 'setter', 'instanceSetter',
      'accessor', 'staticAccessor', 'setter', 'staticSetter',
    )
  }

  expectedCalls(...calls) {
    return calls.map(call => `decorate${call.charAt(0).toUpperCase() + call.substring(1)}`)
  }
}
