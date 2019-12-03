import { Pipe } from '../..'
import { Pipeline } from '../pipeline'

export abstract class WrappedPipe<inputT = any, beforeWrapT = any, outputT = beforeWrapT, afterWrapT = inputT> extends Pipe<inputT, afterWrapT, Pipe<beforeWrapT, outputT>> {
  protected abstract beforeWrapping: Pipe<inputT, beforeWrapT>
  protected wrapped: Pipe<beforeWrapT, outputT>
  protected abstract afterWrapping: Pipe<outputT, afterWrapT>

  constructor(toWrap: Pipe<beforeWrapT, outputT>) {
    super(toWrap)
    this.wrapped = toWrap
  }

  pipe(value?: inputT) {
    let pipeline = new Pipeline<inputT, afterWrapT>(
      this.beforeWrapping, this.wrapped, this.afterWrapping,
    )
    return pipeline.run(value)
  }
}