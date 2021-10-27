import { Suite, SubSuite, Test, TestSuite } from 'polymorphic-tests'
import { ClassInstanceDecorator, InstanceDecorator } from '../src/instance-decorator'

class TestClassInstanceDecorator extends ClassInstanceDecorator {
  instanceDecoratorClass = TestInstanceDecorator

  constructor() {
    super({
      foo: {},
      bar: {},
    })
  }

  decorateNewInstance(instance) {
    super.decorateNewInstance(instance)
    instance.decoratees = []
  }
}

class TestInstanceDecorator extends InstanceDecorator {
  decorateOnInstance(instance, name) {
    let old = super.decorateOnInstance(instance, name),
      decoratorName = this.name
    return () => {
      let ret = old.call(instance)
      instance.decoratees.push(decoratorName)
      return ret
    }
  }
}

class TestClassInstanceDecoratorWithArgs extends TestClassInstanceDecorator {
  instanceDecoratorClass = TestInstanceDecoratorWithArgs
}

class TestInstanceDecoratorWithArgs extends TestInstanceDecorator {
  static withArgs = true
}

class InstanceDecoratorSuite extends TestSuite {
  classInstanceDecoratorCtor
  decorated = null

  before(t) {
    t.expectDecoratees = expected => {
      t.expect(this.decorated.decoratees).to.deep.equal(expected)
      this.decorated.decoratees = []
    }
    t.expectCallChainValue = callChain =>
      t.expect(callChain.value).to.equal(t.expectedCallChainValue)
    this.deconstructDecorators(t, this.classInstanceDecoratorCtor)
  }

  deconstructDecorators(t, ctor) {
    t.decoratorInstance = new ctor
    let decorators = t.decoratorInstance.getDecorators()
    t.decorateClass = decorators.klass
    t.decorateFoo = decorators.foo
    t.decorateBar = decorators.bar
  }

  after(t) {
    this.decorated = null
  }
  
  @Test() 'simple case'(t) {
    this.decorated = new (this.makeDecoratedClass(t))().decorateInstance()
    t.expectedCallChainValue = 5
    this.testChains(t)
  }

  @Test() 'parent implementation works in child'(t) {
    class ChildDecorated extends this.makeDecoratedClass(t) {
      value = 10
    }
    this.decorated = new ChildDecorated().decorateInstance()
    t.expectedCallChainValue = 10
    this.testChains(t)
  }

  @Test() 'child implementation works in parent'(t) {
    let decorateFoo = t.decoratorInstance.instanceDecoratorClass.withArgs
      ? () => t.decorateFoo()
      : () => t.decorateFoo
    class ChildDecorated extends this.makeDecoratedClass(t) {
      @decorateFoo() anotherFoo() { return this }
    }
    t.expectedCallChainValue = 5
    this.decorated = new ChildDecorated().decorateInstance()
    this.testChains(t)
    
    t.expectCallChainValue(this.decorated.anotherFoo())
    t.expectDecoratees(['foo'])
  }
  
  testChains(t) {
    t.expectCallChainValue(this.decorated.foo())
    t.expectDecoratees(['foo'])

    t.expectCallChainValue(this.decorated.bar().foo())
    t.expectDecoratees(['bar', 'foo'])

    t.expectCallChainValue(this.decorated.foobar())
    t.expectDecoratees(['foo', 'bar'])

    t.expectCallChainValue(this.decorated.foo().bar().foobar().barfoo())
    t.expectDecoratees(['foo', 'bar', 'foo', 'bar', 'bar', 'foo'])
  }
}

@Suite() class InstanceDecorators extends TestSuite {}

@SubSuite(InstanceDecorators) class WithoutArgs extends InstanceDecoratorSuite {
  classInstanceDecoratorCtor = TestClassInstanceDecorator

  makeDecoratedClass(t) {
    @t.decorateClass class Decorated {
      value = 5
      @t.decorateFoo foo() { return this }
      @t.decorateBar bar() { return this }
      @t.decorateBar @t.decorateFoo foobar() { return this }
      @t.decorateFoo @t.decorateBar barfoo() { return this }
    }
    return Decorated
  }
}

@SubSuite(InstanceDecorators) class WithArgs extends InstanceDecoratorSuite {
  classInstanceDecoratorCtor = TestClassInstanceDecoratorWithArgs

  makeDecoratedClass(t) {
    @t.decorateClass class Decorated {
      value = 5
      @t.decorateFoo() foo() { return this }
      @t.decorateBar() bar() { return this }
      @t.decorateBar() @t.decorateFoo() foobar() { return this }
      @t.decorateFoo() @t.decorateBar() barfoo() { return this }
    }
    return Decorated
  }
}
