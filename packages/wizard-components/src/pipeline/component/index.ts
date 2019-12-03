import { customElement, html, LitElement, property, query } from 'lit-element'
import { Pipe, PipeStatus } from 'wizard-patterns/lib/pipeline'
import { Pipeline } from 'wizard-patterns/lib/pipeline/pipes'
import { PipeComponent } from '../abstract/pipe-component'

@customElement('wizard-pipeline')
export class PipelineElement<inputT = any, outputT = inputT> extends LitElement {
  @property({noAccessor: true}) startFrom: number = 0
  @property({attribute: false}) currentSlot: number = -1
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
    for (let [index, element] of Object.entries(pipeElements)) {
      let i = Number(index)
      if (element instanceof PipeComponent === false)
        throw new Error(`Pipeline child ${i} is not a PipeComponent`)
      element.setAttribute('slot', `${i}`)
      element.addEventListener('pipe-done', this.pipeDone(i))
    }
    this.pipeElements = pipeElements
    let pipes = this.pipeElements.map(el => el.pipe)
    this.pipeline = new Pipeline<inputT, outputT, Pipe>(...pipes)
    this.pipeline.startFrom = this.startFrom
  }

  private pipeDone(i: number) {
    return (output) => this.onPipeDone(i, output)
  }

  protected onPipeDone(i: number, output) {
    return this.runNextPipe()
  }

  private async runNextPipe(nextIndex = this.currentSlot + 1) {
    let prevIndex = this.currentSlot
    if (nextIndex >= this.pipeline.pipes.length || this.pipeline.pipes.length === 0)
      nextIndex = -1
    
    let slotChangeProm = (prevIndex === nextIndex)
      ? Promise.resolve()
      : new Promise(res => this.pipeSlot.addEventListener('slotchange', res))
    this.currentSlot = nextIndex
    await slotChangeProm
    if (this.currentSlot === -1 && prevIndex === this.pipeline.pipes.length - 1)
      return
    if (this.pipeElements[nextIndex])
      await this.pipeElements[nextIndex].wrappedPipe.waitForStatus(PipeStatus.piping)
    if (this.currentSlot !== -1 && this.pipeElements[this.currentSlot]) {
      await this.pipeElements[this.currentSlot].pipedInto()
      await this.updateComplete
    }
  }
}