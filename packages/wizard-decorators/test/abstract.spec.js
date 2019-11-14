import { SubSuite, Test, TestSuite, Suite } from 'polymorphic-tests'
import { Decorator, DecoratorWithArgs, DecorateeType } from '../src/abstract'
import { DecoratorSuite } from '../src/decorator-suite'

@Suite() class DecoratorFoundation extends TestSuite {}

@SubSuite(DecoratorFoundation) class NoSupportDecoratorTest extends DecoratorSuite {
  decoratorClass = class NoSupportDecorator extends Decorator {}
}


@SubSuite(DecoratorFoundation) class AllSupportDecoratorTest extends DecoratorSuite {
  decoratorClass = class AllSupportDecorator extends Decorator {
    supportedTypes = Object.keys(DecorateeType)
  }
}

@SubSuite(DecoratorFoundation) class SomeSupportDecoratorTest extends DecoratorSuite {
  decoratorClass = class SomeSupportDecorator extends Decorator {
    supportedTypes = [DecorateeType.class, DecorateeType.instanceMethod]
  
    decorate(...args) {
      super.decorate(...args)
      this.ran = true
    }
  }

  @Test() 'runs decorator on supported type'(t) {
    @this.decorate
    class C { }
    t.expect(this.decorator.ran).to.equal(true)
  }
}

class SupportTypeOverridesDecorator extends Decorator {
  supportedTypes = ['all']
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
  before(t) {
    super.before(t)
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

@SubSuite(DecoratorFoundation) class DecoratorWithArgsTest extends DecoratorSuite {
  static didDecorate = false
  decoratorClass = class SomeDecoratorWithArgs extends DecoratorWithArgs {
    supportedTypes = [DecorateeType.all]
    decorate(...args) {
      let decorated = super.decorate(...args)
      DecoratorWithArgsTest.didDecorate = this.args
      return decorated
    }
  }

  after(t) {
    super.after(t)
    DecoratorWithArgsTest.didDecorate = false
  }

  @Test() 'saves args to property'(t) {
    @this.decorate(1,2,3) class C {}
    t.expect(DecoratorWithArgsTest.didDecorate).to.deep.equal([1,2,3])
  }
}