import { Suite, Test } from 'polymorphic-tests'
import { LitElementSuite } from 'polymorphic-web-component-tests'
import { PipeStatus } from 'wizard-patterns/lib/pipeline'

interface PipeDescription {
  tag: string,
  attributes: Object,
}
function makePipeDescription<retDesc extends PipeDescription = PipeDescription> (desc: PipeDescription): retDesc {
  return desc as retDesc
}

interface FormPipeDescription extends PipeDescription {
  tag: 'wizard-pipe-form',
}
let makeFormPipeDescription = (schema = {}, config = {}) => makePipeDescription<FormPipeDescription>({
  tag: 'wizard-pipe-form',
  attributes: {schema, config},
})
let makeNumberFormPipeDescription = (config = {}) => makeFormPipeDescription({type: 'number', title: 'Number'}, config)

@Suite() class PipelineTests extends LitElementSuite {
  static componentPath = require.resolve('./for-tests')
  static componentTag = 'wizard-pipeline-for-tests'
  protected createComponentInBefore = false

  protected async createComponent(t, ...pipes: PipeDescription[]) {
    let component = await super.createComponent(t)
    await t.eval((pipes, {element}) => {
      for (let pipe of pipes) {
        let pipeEl = document.createElement(pipe.tag)
        for (let [key, value] of Object.entries(pipe.attributes))
          pipeEl.setAttribute(key, value instanceof Object ? JSON.stringify(value) : value)
        element.appendChild(pipeEl)
      }
    }, pipes)
    
    return component
  }

  @Test() async 'empty pipeline'(t) {
    await this.createComponent(t)
    t.expect(await t.eval('window["slotElement"]')).to.equal(undefined)
    t.expect(await this.runPipeline(t, 10)).to.equal(10)
    t.expect(await t.eval('slotElement.id')).to.equal('pipe-slot')
    t.expect((await t.eval('slotElement.innerHTML')).trim()).to.equal('')
  }

  @Test() async 'pipeline with simple form'(t) {
    await this.createComponent(t, makeNumberFormPipeDescription())
    await this.startRun(t, 10)
    await this.deconstructNumberFormPipeInSlot(t)
    t.expect(await t.eval('numberLabel.textContent')).to.equal('Number')
    t.expect(await t.eval('numberInput.value')).to.equal('10')
    await this.setNumberFormInputAndSubmit(t, 50)
    t.expect(await this.waitForRunEnd(t)).to.equal(50)
  }

  @Test() async 'pipeline with three forms'(t) {
    await this.createComponent(t, ...Array.from(Array(3), () => makeNumberFormPipeDescription()))
    await this.startRun(t, 10)
    for (let i = 1; i < 4; i++) {
      await this.deconstructNumberFormPipeInSlot(t)
      t.expect(await t.eval('numberLabel.textContent')).to.equal('Number')
      t.expect(await t.eval('numberInput.value')).to.equal(`${i * 10}`)
      await this.setNumberFormInputAndSubmit(t, i * 10 + 10)
    }
    t.expect(await this.waitForRunEnd(t)).to.equal(40)
  }

  @Test() async 'start pipeline from middle'(t) {
    await this.createComponent(t, ...Array.from(Array(3), () => makeNumberFormPipeDescription()))
    await t.eval('element.startFrom = 1')
    await this.startRun(t, 10)
    for (let i = 1; i < 3; i++) {
      await this.deconstructNumberFormPipeInSlot(t)
      t.expect(await t.eval('numberInput.value')).to.equal(`${i * 10}`)
      await this.setNumberFormInputAndSubmit(t, i * 10 + 10)
    }
    t.expect(await this.waitForRunEnd(t)).to.equal(30)
  }

  protected startRun(t, input) {
    return this.runPipeline(t, input, false)
  }

  protected waitForRunEnd(t) {
    return t.eval('pipelineRunPromise')
  }

  protected runPipeline(t, input, waitForRun = true) {
    return t.eval(async (input, waitForRun, {element}) => {
      window['slotElement'] = element.getPipeSlot()
      window['pipelineRunPromise'] = element.run(input)
      let wait = waitForRun
        ? window['pipelineRunPromise']
        : new Promise(res => setTimeout(res, 1)).then(() => element.updateComplete)
      return await wait
    }, input, waitForRun)
  }

  protected async deconstructNumberFormPipeInSlot(t) {
    await t.eval('pipeForm = slotElement.assignedElements()[0]')
    await this.page.waitForFunction('Boolean(pipeForm["jsonForm"])')
    await t.eval('pipeForm.wrappedPipe.waitForStatus(0)')
    await t.eval(`
    jsonForm = pipeForm['jsonForm'].shadowRoot
    numberLabel = jsonForm.querySelector('label')
    numberInput = jsonForm.querySelector('input')
    submitBtn = pipeForm.shadowRoot.querySelector('button#submit')
    `)
  }

  protected async setNumberFormInputAndSubmit(t, input) {
    await t.eval((input) => window['utils'].changeInputValue(window['numberInput'], input), input)
    await t.eval(async PipeStatus => {
      window['submitBtn'].click()
      await window['pipeForm'].pipe.waitForStatus(PipeStatus.piped)
      await new Promise(res => window['slotElement'].addEventListener('slotchange', res))
    }, PipeStatus)
  }
}
