import { Suite, Test, TestSuite } from 'polymorphic-tests'
import { makeComposableFunction, Strategies } from '.'

@Suite() class Composition extends TestSuite {
  @Test() 'compose once'(t) {
    let func = makeComposableFunction(Strategies.flat, [{
      foo: () => 'foo',
      bar: () => 'bar',
    }], () => 'func')
    this.expectCorrectComposition(t, func)
  }

  @Test() 'compose twice'(t) {
    let func = makeComposableFunction(Strategies.flat, [{
      foo: () => 'foo',
    }], makeComposableFunction(Strategies.flat, [{
      bar: () => 'bar',
    }], () => 'func'))
    this.expectCorrectComposition(t, func)
  }
  
  expectCorrectComposition(t, func) {
    t.expect(func()).to.equal('func')
    t.expect(func.foo()).to.equal('foo')
    t.expect(func.bar()).to.equal('bar')
  }
}
