import { customElement, html, LitElement, property, query } from 'lit-element'
import { Pipe, PipeStatus } from 'wizard-patterns/lib/pipeline'
import { Pipeline } from 'wizard-patterns/lib/pipeline/pipes'
import { PipeComponent } from '../abstract/pipe-component'
import { PipelineElementIOType } from '../abstract/types'
import { ComponentPipe } from '../abstract/component-pipe'

@customElement('wizard-pipeline')
export class PipelineElement<inputT = any, outputT = inputT> extends LitElement {
  @property({noAccessor: true}) startFrom: number = 0
  @property({noAccessor: true}) type: PipelineElementIOType = PipelineElementIOType.inMemory
  @property({attribute: false}) currentSlot: number = -1
  @property({noAccessor: true}) ioFactoryArgs: any[] = []
  protected pipeline: Pipeline<inputT, outputT, Pipe>
  protected pipeElements: PipeComponent[]

  @query('#pipe-slot') protected pipeSlot

  render() {
    return html`
      <slot id="pipe-slot" name=${this.currentSlot}></slot>
    `
  }

  async run(input: inputT) {
    this.makePipeline()
    let runProm = this.pipeline.run(input)
    await new Promise(res => setTimeout(res, 1))
    await this.runNextPipe(this.startFrom)
    return runProm
  }

  protected makePipeline() {
    let pipeElements = Array.from(this.children) as PipeComponent[]
    pipeElements.forEach((element, i) => this.initPipeElement(i, element))
    this.pipeElements = pipeElements
    this.pipeline = this.makePipelineFromElements()
  }

  private makePipelineFromElements() {
    let pipes = this.pipeElements.map(el => el.pipe),
      pipeline = new Pipeline<inputT, outputT, ComponentPipe>(...pipes)
    pipeline.startFrom = this.startFrom
    return pipeline
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
      : new Promise(res =>
          this.pipeSlot.addEventListener('slotchange', res))
  }

  private async updateNextPipeElement(prevIndex, nextIndex) {
    if (this.currentSlot === -1 && prevIndex === this.pipeline.pipes.length - 1)
      return
    if (this.pipeElements[nextIndex])
      await this.pipeElements[nextIndex].pipe.manual.waitForStatus(PipeStatus.piping)
    if (this.currentSlot !== -1 && this.pipeElements[this.currentSlot]) {
      await this.pipeElements[this.currentSlot].pipedInto()
      await this.updateComplete
    }
  }
}