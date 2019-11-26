require('wise-inspection')(Promise)
import { Suite, SubSuite, Test, TestSuite } from 'polymorphic-tests'
import { TestComponentSuite } from './index.spec'

abstract class PerComponent extends TestComponentSuite {
  createComponentInBefore = false
  errorEvents = ['custom-error']
  get hookMethodAndPromiseNames() {
    return super.hookMethodAndPromiseNames.set(...this.event('custom-event'))
  }

  @Test() 'should wait for custom-event'(t) {
    return this.createComponentAndDispatchCustomEvent(t)
  }

  protected async createComponentAndDispatchCustomEvent(t) {
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
    let createComponentError, createCompProm, p
    try {
      createCompProm = this.createComponent(t)
      p = createCompProm.catch(e => {
        createComponentError = e
      })
    } catch (e) {}
    await new Promise(res => setTimeout(res, 500))
    //@ts-ignore
    t.expect(p.inspect().state).to.equal('pending')
    await this.page.evaluate('dispatchEvent(new ErrorEvent("custom-error", {error: new Error("custom error")}))')
    //@ts-ignore
    if (p.inspect().state === 'pending')
      await p
    //@ts-ignore
    t.expect(createCompProm.inspect().state).to.equal('rejected')
    //@ts-ignore
    t.expect(createCompProm.inspect().reason.message).to.include('custom error')
    //@ts-ignore
    t.expect(createComponentError).to.equal(createCompProm.inspect().reason)
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

@Suite() class TestComponents extends TestSuite {}
@SubSuite(TestComponents) class One extends PerComponent {}
@SubSuite(TestComponents) class Two extends PerComponent {
  static componentPath = require.resolve('./test-web-component-2')
  static componentTag = 'test-element-2'
}
@SubSuite(TestComponents) class Both extends PerComponent {
  static componentPath = require.resolve('./test-web-component-with-both')
  static componentTag = 'test-element-with-both'

  @Test() async 'should render both test components'(t) {
    await this.createComponentAndDispatchCustomEvent(t)
    let headers = await Promise.all(['test-element', 'test-element-2'].map(elTag => t.eval((elTag, {element}) => {
      let subEl = element.shadowRoot.querySelector(`${elTag}`)
      if (!subEl) return null
      let el = subEl.shadowRoot.querySelector('h1')
      return el && el.textContent
    }, elTag)))
    t.expect(headers).to.deep.equal([
      'Test Element',
      'Test Element 2',
    ])
  }
}