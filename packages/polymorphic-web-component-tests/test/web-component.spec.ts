require('wise-inspection')(Promise)
import path from 'path'
import { Suite, Test, TestSuite, SubSuite } from 'polymorphic-tests'
import { LitElementSuite } from '../src/lit-element-suite'

abstract class TestComponentSuite extends LitElementSuite {
  static componentPath = path.resolve(__dirname, 'test-web-component.ts')
  static componentTag = 'test-element'
}

@Suite() class TestingWebComponents extends TestSuite {}
@SubSuite(TestingWebComponents) class Eval extends TestSuite {}

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

abstract class PerComponent extends TestComponentSuite {
  createComponentInBefore = false
  errorEvents = ['custom-error']
  get hookMethodAndPromiseNames() {
    return super.hookMethodAndPromiseNames.set(...this.event('custom-event'))
  }

  @Test() async 'should wait for custom-event'(t) {
    let p = this.createComponent(t)
    await new Promise(res => setTimeout(res, 500))
    //@ts-ignore
    t.expect(p.inspect().state).to.equal('pending')
    await this.page.evaluate('dispatchEvent(new Event("custom-event"))')
    await p
    //@ts-ignore
    t.expect(p.inspect().state).to.equal('fulfilled')
  }

  @Test() async 'catch custom-error'(t) {
    let p = this.createComponent(t)
    await new Promise(res => setTimeout(res, 500))
    //@ts-ignore
    t.expect(p.inspect().state).to.equal('pending')
    await this.page.evaluate('dispatchEvent(new ErrorEvent("custom-error", {error: new Error("custom error")}))')
    //@ts-ignore
    if (p.inspect().state === 'pending')
      try {await p} catch (e) {console.log('await p error', e)}
    //@ts-ignore
    t.expect(p.inspect().state).to.equal('rejected')
    //@ts-ignore
    console.log(p.inspect().reason)
    //@ts-ignore
    t.expect(p.inspect().reason.message).to.include('custom error')
  }
  
  @Test() async 'id should be standard and component should exist'(t) {
    let stopDispatch = await this.dispatchContinuously('custom-event')
    await this.createComponent(t).then(stopDispatch)
    t.expect(await t.eval('element.id'))
      .to.equal(await t.$eval('#' + this.componentElementId, el => el.id))
      .to.equal(this.componentElementId)
  }


  protected async dispatchContinuously(eventName: string) {
    await this.page.evaluate(eventName => {
      window[`shouldDispatch_${eventName}_Continuously`] = true
      let dispatchAndWait = () => {
        if (window[`shouldDispatch_${eventName}_Continuously`]) {
          return new Promise(res => setTimeout(res, 1))
            .then(() => window.dispatchEvent(new Event(eventName)))
            .then(() => dispatchAndWait())
        }
      }
      dispatchAndWait()
      return null
    }, eventName)
    return () =>
      this.page.evaluate(`window['shouldDispatch_${eventName}_Continuously'] = false`)
  }
}

@SubSuite(TestingWebComponents) class TestComponent extends PerComponent {}
@SubSuite(TestingWebComponents) class TestComponent2 extends PerComponent {
  static componentPath = path.resolve(__dirname, 'test-web-component-2.ts')
  static componentTag = 'test-element-2'
}
