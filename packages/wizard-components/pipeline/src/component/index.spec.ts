import { Suite, Test, SubSuite, TestSuite } from 'polymorphic-tests'
import { LitElementSuite } from 'polymorphic-web-component-tests'
import { PipeStatus } from 'wizard-patterns/lib/pipeline'
import { PipelineElementIOType } from '../abstract/types'
import querystring from 'querystring'

// Same as in wizard-form
const ONLY_DATA_VALUE = '_ONLY_DATA_VALUE_'

interface PipeDescription<tag extends string = string> {
  tag: tag,
  attributes: Object,
}
function makePipeDescription<retDesc extends PipeDescription = PipeDescription> (desc: PipeDescription): retDesc {
  return desc as retDesc
}

let makeFormPipeDescription = (schema = {}, config = {}) => makePipeDescription<PipeDescription<'wizard-pipe-form'>>({
  tag: 'wizard-pipe-form',
  attributes: {schema, config},
})
let makeNumberFormPipeDescription = (config = {}) => makeFormPipeDescription({
  components: [
    {
      type: 'number',
      key: ONLY_DATA_VALUE,
      label: 'Number',
    },
    {
      type: 'button',
      action: 'submit',
      label: 'Submit',
    },
  ]
}, config)

@Suite() class Pipelines extends TestSuite {}

abstract class PipelineSuite extends LitElementSuite {
  static componentPath = require.resolve('./for-tests')
  static componentTag = 'wizard-pipeline-for-tests'
  protected createComponentInPageSetup = false
  abstract type: PipelineElementIOType
  protected ioFactoryArgs: any[] = []
  protected lastCreateComponentArgs = []
  protected startFrom: number = 0

  protected async createComponent(t, ...pipes: PipeDescription[]) {
    let component = await super.createComponent(t)
    pipes = this.lastCreateComponentArgs = pipes.length ? pipes : this.lastCreateComponentArgs
    await t.eval((pipes, type, ioFactoryArgs, startFrom, {element}) => {
      element.ioFactoryArgs = JSON.parse(ioFactoryArgs)
      if ([undefined, null].includes(type) === false) element.setAttribute('type', type)
      for (let pipe of pipes) {
        let pipeEl = document.createElement(pipe.tag)
        for (let [key, value] of Object.entries(pipe.attributes))
          pipeEl.setAttribute(key, value instanceof Object ? JSON.stringify(value) : value)
        element.appendChild(pipeEl)
      }
      element.startFrom = startFrom
    }, pipes, this.type, JSON.stringify(this.ioFactoryArgs), this.startFrom)
    return component
  }

  protected startRun(t, input) {
    return this.runPipeline(t, input, false)
  }

  protected async getPipeResult(t) {
    t.expect(await t.eval('element.pipeline.status')).to.equal(PipeStatus.piped)
    return this.waitForRunEnd(t)
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
        // : element.updateComplete
        : new Promise(res => setTimeout(res, 15)).then(() => element.updateComplete)
      return await wait
    }, input, waitForRun)
  }

  protected async deconstructNumberFormPipeInSlot(t) {
    await this.page.waitForFunction('Boolean(slotElement.assignedElements()[0])')
    await t.eval('pipeForm = slotElement.assignedElements()[0]')
    await this.page.waitForFunction(`Boolean(pipeForm['wizardForm'])`)
    await t.eval(`wizardForm = pipeForm['wizardForm']`)
    await t.eval('pipeForm.pipe.manual.waitForStatus(0)')
    await t.eval('wizardForm.updateComplete')
    await t.eval(`
    numberLabel = wizardForm.querySelector('label')
    numberInput = wizardForm.querySelector('input')
    submitBtn = wizardForm.querySelector('button[type=submit]')
    `)
  }

  protected waitForSlotChange = true  
  protected async setNumberFormInputAndSubmit(t, input) {
    await t.eval((input) => window['utils'].changeInputValue(window['numberInput'], input), input)
    let index = await t.eval(async (PipeStatus, waitForSlotChange, {element}) => {
      let index = Number(element.currentSlot)
      window['submitBtn'].click()
      await window['pipeForm'].pipe.waitForStatus(PipeStatus.piped)
      if (waitForSlotChange)
        await new Promise(res => window['slotElement'].addEventListener('slotchange', res))
      return index
    }, PipeStatus, this.waitForSlotChange)
    if (this.waitForSlotChange === false)
      await this.page.waitForNavigation()
    else {
      await t.eval('element.updateComplete')
      await t.eval(async () => {
        let currentSlot = window['slotElement'].assignedElements()[0]
        if (currentSlot && currentSlot.pipe) {
          await currentSlot.pipe.manual.waitForStatus(0)
          await currentSlot.updateComplete
        } else
          await window['element'].pipeline.waitForStatus(1)
      })
    }
    await this.runAfterPipe(t, index)
  }

  protected runAfterPipe(t, pipeIndex: number) {}
}

abstract class SharedPipelineTests extends PipelineSuite {
  @Test() async 'empty pipeline'(t) {
    await this.createComponent(t)
    t.expect(await t.eval('window["slotElement"]')).to.equal(undefined)
    t.expect(await this.runPipeline(t, 10)).to.equal(10)

    t.expect(await t.eval('slotElement.id')).to.equal('pipe-slot')
    t.expect(await t.eval('slotElement.assignedElements().length')).to.equal(0)
  }

  @Test() async 'pipeline with simple form'(t) {
    await this.createComponent(t, makeNumberFormPipeDescription())
    await this.startRun(t, 10)
    await this.deconstructNumberFormPipeInSlot(t)
    t.expect((await t.eval('numberLabel.textContent')).trim()).to.equal('Number')
    t.expect(await t.eval('numberInput.value')).to.equal('10')
    await this.setNumberFormInputAndSubmit(t, 50)
    t.expect(await this.getPipeResult(t)).to.equal(50)
  }

  @Test() async 'pipeline with three forms'(t) {
    await this.createComponent(t, ...Array.from(Array(3), () => makeNumberFormPipeDescription()))
    await this.startRun(t, 10)
    for (let i = 1; i < 4; i++) {
      await this.deconstructNumberFormPipeInSlot(t)
      t.expect(await t.eval('numberInput.value')).to.equal(`${i * 10}`)
      await this.setNumberFormInputAndSubmit(t, i * 10 + 10)
    }
    t.expect(await this.getPipeResult(t)).to.equal(40)
  }

  @Test() async 'start pipeline from middle'(t) {
    this.startFrom = 1
    await this.createComponent(t, ...Array.from(Array(4), () => makeNumberFormPipeDescription()))
    await this.startRun(t, 10)
    for (let i = 1; i < 4; i++) {
      await this.deconstructNumberFormPipeInSlot(t)
      t.expect(await t.eval('numberInput.value')).to.equal(`${i * 10}`)
      await this.setNumberFormInputAndSubmit(t, i * 10 + 10)
    }
    
    t.expect(await this.getPipeResult(t)).to.equal(40)
  }
}

@SubSuite(Pipelines) class InMemory extends SharedPipelineTests {
  type = PipelineElementIOType.inMemory
}

abstract class StoragePipelineSuite extends SharedPipelineTests {
  shouldSetItemOnRunPipeline = true

  async runPipeline(t, input, waitForRun = true) {
    if (this.shouldSetItemOnRunPipeline) {
      if (input.value === undefined && input.index === undefined) {
        await this.setItem(t, {value: input, index: this.startFrom})
      } else {
        await this.setItem(t, input)
        input = input.value
      }
    }
    return await super.runPipeline(t, input, waitForRun)
  }

  protected async runAfterPipe(t, pipeIndex: number) {
    t.expect((await this.getItem(t)).index).to.equal(pipeIndex + 1)
  }

  abstract getItem(t): Promise<any>
  abstract setItem(t, value): Promise<any>
}

abstract class PageStorageSuite extends StoragePipelineSuite {
  storageKey = 'test-storage-key'
  ioFactoryArgs = [this.storageKey]

  getItem(t) {
    return t.eval((type, key) =>
      //@ts-ignore
      JSON.parse(window[type].getItem(key)),
      this.type, this.storageKey,
    )
  }

  setItem(t, value) {
    return t.eval((type, key, value) =>
      // @ts-ignore
      window[type].setItem(key, JSON.stringify(value)),
      this.type, this.storageKey, value
    )
  }
}

@SubSuite(Pipelines) class LocalStorage extends PageStorageSuite {
  type = PipelineElementIOType.localStorage
}

@SubSuite(Pipelines) class SessionStorage extends PageStorageSuite {
  type = PipelineElementIOType.sessionStorage
}

@SubSuite(Pipelines) class QueryParamsStorage extends StoragePipelineSuite {
  type = PipelineElementIOType.queryParams
  query = ''
  waitForSlotChange = false
  async refreshForPipe(t, url?: string, gotoUrl: boolean = true) {
    if (gotoUrl && !url)
      url = this.componentUrl + (this.query ? '?' + this.query : await t.eval('window.location.search'))
    this.createComponentInPageSetup = true
    this.shouldSetItemOnRunPipeline = false
    await this.refresh(t, url, gotoUrl)
    await this.startRun(t, null)
  }

  async getItem(t) {
    let query = (await this.page.evaluate('window.location.search')).slice(1)
    let parsedQuery = await querystring.parse(query)
    for (let key of ['index', 'value'])
      if (parsedQuery && parsedQuery[key] !== undefined)
        //@ts-ignore
        parsedQuery[key] = Number(parsedQuery[key] instanceof Array
          ? parsedQuery[key][0]
          : parsedQuery[key])
    return parsedQuery
  }

  async runAfterPipe(t, index) {
    await super.runAfterPipe(t, index)
    await this.refreshForPipe(t, null, false)
  }
  async setItem(t, value) {
    this.query = querystring.stringify(value)
    await this.refreshForPipe(t, this.componentUrl + '?' + this.query, true)
  }
}
