import { LitElement, property } from 'lit-element'
import { CachedReturn } from 'wizard-decorators'
import { PipeStatus } from 'wizard-patterns/lib/pipeline'
import { ManualPipe, PassThroughPipe, WrappedPipe } from 'wizard-patterns/lib/pipeline/pipes'
import { PipeComponentType } from './types'

class ComponentPipe<beforeInputT = any, inputT = any, outputT = inputT, afterOutputT = beforeInputT> extends WrappedPipe<beforeInputT, inputT, outputT, afterOutputT> {
  beforeWrapping
  afterWrapping
}

export abstract class PipeComponent<inputT = any, outputT = inputT> extends LitElement {
  @property({attribute: false}) beforeWrapping
  @property({attribute: false}) afterWrapping
  protected _type: PipeComponentType = PipeComponentType.inMemory
  get type(): PipeComponentType {
    return this._type
  }
  
  @property({type: PipeComponentType, noAccessor: true})
  set type(type: PipeComponentType) {
    if (type === this.type)
    this._type = type
    let {before, after} = this.getWrappingsForType(type)
    this.beforeWrapping = before
    this.afterWrapping = after
  }
  
  @property() wrappedPipe: ManualPipe<inputT, outputT> = new ManualPipe<inputT, outputT>()

  protected waitForInput = true
  protected UNDEFINED_INPUT = Symbol('UNDEFINED_INPUT')
  @property({attribute: false}) protected input: inputT | Symbol = this.UNDEFINED_INPUT 
  public async pipedInto() {
    await this.wrappedPipe.waitForStatus(PipeStatus.piping)
    this.input = this.wrappedPipe.input
  }

  @CachedReturn get pipe() {
    if (this.beforeWrapping === undefined && this.afterWrapping === undefined)
      this.type = this._type
    let pipe = new ComponentPipe(this.wrappedPipe)
    pipe.beforeWrapping = this.beforeWrapping
    pipe.afterWrapping = this.afterWrapping
    return pipe
  }

  getWrappingsForType(type: PipeComponentType) {
    let wrappings = new Array(2).fill(null)
    switch (type) {
      case PipeComponentType.inMemory:
      default:
        wrappings = wrappings.map(() => new PassThroughPipe)
    }
    return {
      before: wrappings[0],
      after: wrappings[1],
    }
  }

  shouldUpdate() {
    return Boolean(
      this.wrappedPipe
      && (
        this.waitForInput === false
        || (this.input !== this.UNDEFINED_INPUT)
      )
    )
  }

  protected async pipeOut(output: outputT) {
    await this.wrappedPipe.next(output)
    await this.pipe.waitForStatus(PipeStatus.piped)
    this.dispatchEvent(new CustomEvent('pipe-done', {detail: output}))
  }
}
