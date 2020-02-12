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
}

class TestInstanceDecorator extends InstanceDecorator {
  decorateOnInstance(instance, name) {
    instance.decoratees.push(this.name)
    return super.decorateOnInstance(instance, name)
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
  }

  deconstructDecorators(t, ctor) {
    let decorator = new ctor,
      decorators = decorator.getDecorators()
    t.decorateClass = decorators.klass
    t.decorateFoo = decorators.foo
    t.decorateBar = decorators.bar
  }

  after(t) {
    this.decorated = null
  }
  
  @Test() 'simple case'(t) {
    this.deconstructDecorators(t, this.classInstanceDecoratorCtor)
    let decorated = this.decorated = this.makeDecorated(t)

    decorated.foo()
    t.expectDecoratees(['foo'])

    decorated.foo().bar()
    t.expectDecoratees(['foo', 'bar'])

    decorated.foobar()
    t.expectDecoratees(['foo', 'bar'])

    decorated.foo().bar().foobar().barfoo()
    t.expectDecoratees(['foo', 'bar', 'foo', 'bar', 'bar', 'foo'])
  }
}

@Suite() class InstanceDecorators extends TestSuite {}

@SubSuite(InstanceDecorators) class WithoutArgs extends InstanceDecoratorSuite {
  classInstanceDecoratorCtor = TestClassInstanceDecorator

  makeDecorated(t) {
    @t.decorateClass class Decorated {
      decoratees = []
      @t.decorateFoo foo() { return this }
      @t.decorateBar bar() { return this }
      @t.decorateBar @t.decorateFoo foobar() { return this }
      @t.decorateFoo @t.decorateBar barfoo() { return this }
    }
    return new Decorated
  }
}

@SubSuite(InstanceDecorators) class WithArgs extends InstanceDecoratorSuite {
  classInstanceDecoratorCtor = TestClassInstanceDecoratorWithArgs

  makeDecorated(t) {
    @t.decorateClass class Decorated {
      decoratees = []
      @t.decorateFoo() foo() { return this }
      @t.decorateBar() bar() { return this }
      @t.decorateBar() @t.decorateFoo() foobar() { return this }
      @t.decorateFoo() @t.decorateBar() barfoo() { return this }
    }
    return new Decorated
  }
}
