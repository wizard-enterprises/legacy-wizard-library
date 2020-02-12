import { Suite, Test } from 'polymorphic-tests'
import { ComposableFunctionSuite } from '../abstract/index.spec'
import { Strategies, compose } from '../..'

@Suite() class FlatComposition extends ComposableFunctionSuite {
  strategy = Strategies.flat
  @Test() 'function works when composing nothing'(t) {
    this.composeArgs = [x => x * 2]
    t.expect(this.composeAndCall([2])).to.equal(4)
    t.expect(this.composeAndCall([5])).to.equal(10)
  }

  @Test() 'simple composition'(t) {
    this.composeArgs = [
      {
        by3: x => x * 3,
        by4: x => x * 4,
      },
    ]
    let func = x => x * 2
    @compose.klass class K {
      @compose.compose(this.strategy, ...this.composeArgs)
      func(x) {return func(x)}
    }

    let funcs = [
      this.compose(this.composeArgs, func),
      (new K).func,
    ]
    for (let func of funcs) {
      t.expect(func(2)).to.equal(4)
      t.expect(func.by3.name).to.equal('by3')
      t.expect(func.by3(2)).to.equal(6)
      t.expect(func.by4(2)).to.equal(8)
    }
  }

  @Test() 'accept null func to throw on direct calls'(t) {
    this.composeArgs = [
      [{
        foo: () => 'foo',
        bar: () => 'bar',
      }],
      null,
    ]
    let func = this.compose(...this.composeArgs)
    t.expect(func.foo()).to.equal('foo')
    t.expect(func.bar()).to.equal('bar')
    t.expect(func).to.throw(
      `Can't be called directly, use one of .foo, .bar`)
  }
}
