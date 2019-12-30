import { customElement, html, LitElement, property, query } from 'lit-element'
import { Pipe, PipeStatus } from 'wizard-patterns/lib/pipeline'
import { Pipeline } from 'wizard-patterns/lib/pipeline/pipes'
import { PipeComponent } from '../abstract/pipe-component'
import { PipelineElementIOType } from '../abstract/types'
import { ComponentPipe, StorageIOReader } from '../abstract/component-pipe'

@customElement('wizard-pipeline')
export class PipelineElement<inputT = any, outputT = inputT> extends LitElement {
  @property({noAccessor: true}) startFrom: number = 0
  @property({noAccessor: true}) type: PipelineElementIOType = PipelineElementIOType.inMemory
  @property({attribute: false}) currentSlot: number = -1
  @property({noAccessor: true}) ioFactoryArgs: any[] = []
  protected pipeline: Pipeline<inputT, outputT, Pipe>
  protected get pipeElements(): PipeComponent[] {
    return Array.from(this.children) as PipeComponent[]
  }

  @query('#pipe-slot') protected pipeSlot

  async _getUpdateComplete() {
    await super._getUpdateComplete()
    let currentPipeElement = this.pipeElements[this.currentSlot]
    if (currentPipeElement)
      await currentPipeElement.updateComplete
  }

  render() {
    return html`
      <slot id="pipe-slot" name=${this.currentSlot}></slot>
    `
  }

  async run(input: inputT) {
    input = this.getDataByType(null, input).value
    let runProm
    if (this.children.length) {
      this.makePipeline()
      runProm = this.pipeline.run(input)
      await new Promise(res => setTimeout(res, 1))
      await this.runNextPipe(this.getStartingIndex())
    } else {
      runProm = Promise.resolve(input)
    }
    return runProm
  }

  protected makePipeline() {
    this.pipeElements.forEach((element, i) => this.initPipeElement(i, element))
    this.pipeline = this.makePipelineFromElements()
  }

  private makePipelineFromElements() {
    let pipes = this.pipeElements.map(el => el.pipe),
      pipeline = new Pipeline<inputT, outputT, ComponentPipe>(...pipes)
    pipeline.startFrom = this.getStartingIndex()
    return pipeline
  }

  private getStartingIndex() {
    let index = this.startFrom
    if (this.type !== PipelineElementIOType.inMemory) {
      let storedIndex = this.getDataByType(this.startFrom).index || index
      index = Math.max(index, storedIndex)
    }
    return index
  }

  private getDataByType(inMemoryIndex = this.currentSlot, inMemoryInput?: any) {
    if (this.type === PipelineElementIOType.inMemory)
      return {
        index: inMemoryIndex,
        value: inMemoryInput,
      }
    return this.type === PipelineElementIOType.queryParams
      ? this.getQueryData()
      : this.getStorageData()
  }

  private getQueryData() {
    let params = new URLSearchParams(window.location.search),
      data: any = {}
    if (params.has('index')) {
      let rawIndex = Number(params.get('index'))
      if (Number.isNaN(rawIndex) === false)
        data.index = rawIndex
    }
    if (params.has('value'))
      try {
        data.value = JSON.parse(params.get('value'))
      } catch (e) {
        data.value = params.get('value')
      }
    return data
  }

  private getStorageData() {
    let data: any = {},
      //@ts-ignore
      stored = new StorageIOReader(this.type, this.ioFactoryArgs[0]).read()
    data.index = stored && stored.index && (stored.index === Number(stored.index))
      ? stored.index
      : undefined
    try {
      data.value = stored && JSON.parse(stored.value)
    } catch (e) {
      data.value = stored && stored.value
    }
    return data
  }

  private initPipeElement(index: number, element: PipeComponent) {
    if (element instanceof PipeComponent === false)
      throw new Error(`Pipeline child ${index} is not a PipeComponent`)
    element.ioFactoryArgs = this.ioFactoryArgs
    element.setAttribute('type', this.type)
    element.setAttribute('slot', `${index}`)
    element.addEventListener('pipe-done', () => this.runNextPipe())
  }

  private async runNextPipe(nextIndex = this.currentSlot + 1) {
    let prevIndex = this.currentSlot
    if (this.isAfterPipelineEnd(nextIndex))
      nextIndex = -1
    let slotChangeProm = this.waitForSlotChangeForIndices(prevIndex, nextIndex)
    this.currentSlot = nextIndex
    await slotChangeProm
    await this.updateNextPipeElement(prevIndex, nextIndex)
  }

  private isAfterPipelineEnd(index: number) {
    let pipes = this.pipeline.pipes
    return index >= pipes.length || pipes.length === 0
  }

  private waitForSlotChangeForIndices(prevIndex, nextIndex) {
    return prevIndex === nextIndex
      ? Promise.resolve()
      : this.waitForSlotChange()
  }
  
  private waitForSlotChange() {
    return new Promise(res =>
      this.pipeSlot.addEventListener('slotchange', res))
  }

  private async updateNextPipeElement(prevIndex, nextIndex) {
    if (this.currentSlot === -1 && prevIndex === this.pipeline.pipes.length - 1)
      return
    if (this.pipeElements[nextIndex])
      await this.pipeElements[nextIndex].pipe.manual.waitForStatus(PipeStatus.piping)
    if (this.currentSlot !== -1 && this.pipeElements[this.currentSlot]) {
      let currentPipe = this.pipeElements[this.currentSlot]
      await currentPipe.pipedInto()
      await currentPipe.updateComplete
      await this.updateComplete
    }
  }
}