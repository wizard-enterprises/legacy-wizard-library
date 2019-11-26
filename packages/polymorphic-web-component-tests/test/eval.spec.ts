import { TestSuite, Suite, SubSuite, Test } from 'polymorphic-tests'
import { TestComponentSuite } from './index.spec'

@Suite() class Eval extends TestSuite {}

@SubSuite(Eval) class StringEval extends TestComponentSuite {
  @Test() async 'return expression'(t) {
    t.expect(await t.eval('5')).to.equal(5)
  }

  @Test() async 'have convenience globals on window for string eval'(t) {
    t.expect(await t.eval('element.id')).to.equal(this.componentElementId)
  }
}

@SubSuite(Eval) class FunctionEval extends TestComponentSuite {
  @Test() async 'no args'(t) {
    t.expect(await t.eval(() => 5)).to.equal(5)
  }

  @Test() async 'custom arg'(t) {
    t.expect(await t.eval(x => x, 5)).to.equal(5)
    t.expect(await t.eval(x => x, null)).to.equal(null)
  }

  @Test() async 'multiple args'(t) {
    t.expect(await t.eval((x, y) => x + y, 4, 6)).to.equal(10)
  }

  @Test() async 'async'(t) {
    t.expect(await t.eval(async (x) => {
      return x + 5
    }, 5)).to.equal(10)
  }
}

@SubSuite(Eval) class QueryEval extends TestComponentSuite {
  private selector = `#${this.componentElementId}`

  @Test() async 'query for component'(t) {
    t.expect(await t.$eval(
      this.selector, comp => comp.id
    )).to.equal(this.componentElementId)
  }

  @Test() async 'come before custom args'(t) {
    t.expect(await t.$eval(
      this.selector, (comp, x) => comp.id + x, 'x'
    )).to.equal(this.componentElementId + 'x')
  }
}

@SubSuite(Eval) class ConvenienceGlobalsInjection extends TestComponentSuite {
  @Test() async 'pass to func when not receiving custom arg'(t) {
    t.expect(await t.eval(g => g.element.id)).to.equal(this.componentElementId)
  }

  @Test() async 'come after custom args'(t) {
    t.expect(await t.eval((x, g) => g.element.id + x, 'a')).to.equal(this.componentElementId + 'a')
    t.expect(await t.eval(
      (x, y, z, g) => g.element.id + x + y + z, 'a', 'b', 'c'
    )).to.equal(this.componentElementId + 'abc')
  }

  @Test() async 'come before rest params'(t) {
    t.expect(await t.eval(
      (g, ...rest) => g.element.id + rest.join(''), 'a', 'b', 'c'
    )).to.equal(this.componentElementId + 'abc')
  }

  @Test() async 'query, then custom args, then convenience globals, then rest params'(t) {
    t.expect(await t.$eval(
      '#' + this.componentElementId,
      (el, x, y, g, ...rest) => el.id + g.element.id + x + y + rest.join(''), 'x', 'y', 'a', 'b', 'c'
    )).to.equal(this.componentElementId + this.componentElementId + 'xyabc')
  }
}