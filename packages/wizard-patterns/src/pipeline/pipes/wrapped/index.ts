import { Pipe, PipeOpts } from '../..'
import { Pipeline } from '../pipeline'
import { PassThroughPipe } from '../passthrough'

export abstract class WrappedPipe<inputT = any, beforeWrapT = any, outputT = beforeWrapT, afterWrapT = inputT> extends Pipeline<inputT, afterWrapT, Pipe<beforeWrapT, outputT>> {
  protected assemblable = true
  protected shouldAssembleOnRun = true
  protected abstract beforeWrapping: Pipe<inputT, beforeWrapT>
  protected abstract afterWrapping: Pipe<outputT, afterWrapT> 

  constructor(toWrap: Pipe<beforeWrapT, outputT>, opts: PipeOpts = {}) {
    super([toWrap || new PassThroughPipe], opts)
  }

  _assemble() {
    //@ts-ignore
    this.pipes = [
      this.beforeWrapping, ...this.pipes, this.afterWrapping,
    ]
    super._assemble()
  }

  // pipe(value?: inputT) {
  //   // let pipeline = new Pipeline<inputT, afterWrapT>([
  //   // ])
  //   return pipeline.run(value)
  // }
}

export class ManualWrappedPipe<inputT = any, beforeWrapT = any, outputT = beforeWrapT, afterWrapT = inputT> extends WrappedPipe<inputT, beforeWrapT, outputT, afterWrapT> {
  beforeWrapping: Pipe<inputT, beforeWrapT>
  afterWrapping: Pipe<outputT, afterWrapT>
}