import { SubSuite, Test } from 'polymorphic-tests'
import { ComposableFunction, ComposableFunctionSuite } from '../abstract/index.spec'
import { Strategies } from '../..'
import { makeFunctionFromStringified } from 'wizard-utils'

@SubSuite(ComposableFunction) class ArgsBuilderComposition extends ComposableFunctionSuite {
  strategy = Strategies.argsBuilder

  getCalc() {
    return makeFunctionFromStringified(
      `(op, x, y) => eval([x, op, y].join(''))`)
  }

  @Test() 'function works when composing nothing'(t) {
    this.composeArgs = [this.getCalc()]
    let calc = this.compose(...this.composeArgs)
    t.expect(calc('+', 2, 3)).to.equal(5)
    t.expect(calc('*', 2, 3)).to.equal(6)
  }

  @Test() 'compose add and multiply'(t) {
    this.composeArgs = [
      [{
        add: (x, y) => ['+', x, y],
        mult: (x, y) => ['*', x, y],
      }],
      this.getCalc(),
    ]
    let calc = this.compose(...this.composeArgs)
    t.expect(calc('/', 4, 2)).to.equal(2)
    t.expect(calc.add(2, 3)).to.equal(5)
    t.expect(calc.mult(2, 3)).to.equal(6)
  }

  @Test() 'compose arg building chain'(t) {
    let addToArgObj = (argObj, name) => {
        t.expect(argObj[name]).to.equal(undefined)
        return [{...argObj, [name]: name}]
      }
    this.composeArgs = [
      [{
        foo: (argObj = {}) => addToArgObj(argObj, 'foo'), 
        bar: (argObj = {}) => addToArgObj(argObj, 'bar'), 
      }, {
        recursive: true,
      }],
      argObj => argObj,
    ]
    let func = this.compose(...this.composeArgs)
    
    t.expect(func({})).to.deep.equal({})
    t.expect(func.foo()).to.deep.equal({foo: 'foo'})
    t.expect(func.bar()).to.deep.equal({bar: 'bar'})
    t.expect(func.foo.bar())
      .to.deep.equal(func.bar.foo())
      .to.deep.equal({
        foo: 'foo', bar: 'bar',
      })
  }
}
