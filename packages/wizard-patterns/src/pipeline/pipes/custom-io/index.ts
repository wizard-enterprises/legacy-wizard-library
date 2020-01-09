import { Pipe, PipeStatus, PipeOpts } from '../..'
import { PassThroughPipe } from '../passthrough'
import { WrappedPipe, ManualWrappedPipe } from '../wrapped'
import { TransformPipe } from '../transform'
import { Pipeline } from '../pipeline'

export interface CustomIOPipeFactoryResult<inputT = any, outputT = inputT> {
  input(inputT?: inputT): inputT
  output(outputT?: outputT): outputT
}

export abstract class CustomIOPipe<T, inputT = any, outputT = inputT> extends Pipeline<inputT, outputT> {
  defaultType?: T
  protected assemblable = true
  protected shouldAssembleOnRun = true
  public ioPipe?: Pipe<inputT, outputT> | ((inputT) => outputT | Promise<outputT>)
  protected type: T

  constructor(type?: T, opts: PipeOpts = {}) {
    super([], opts)
    this.type = type === undefined ? this.defaultType : type
    if (this.type === undefined)
      throw new Error('custom IO pipe instantiated with no type or default type')
  }

  abstract factory(T): CustomIOPipeFactoryResult
  protected _assemble() {
    let customIO = this.factory(this.type),
      pipe = this.ioPipe instanceof Pipe
        ? this.ioPipe
        : new TransformPipe<inputT, outputT>(this.ioPipe)

    this.pipes = [
      new TransformPipe(input => customIO.input(input)),
      pipe,
      new TransformPipe(output => customIO.output(output)),
    ]
    super._assemble()
  }
}