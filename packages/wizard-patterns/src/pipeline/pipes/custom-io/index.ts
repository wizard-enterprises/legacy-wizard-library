import { Pipe, PipeStatus } from '../..'
import { PassThroughPipe } from '../passthrough'
import { WrappedPipe, ManualWrappedPipe } from '../wrapped'
import { TransformPipe } from '../transform'

export interface CustomIOPipeFactoryResult<inputT = any, outputT = inputT> {
  input(inputT?: inputT): inputT
  output(outputT?: outputT): outputT
}

export abstract class CustomIOPipe<T, inputT = any, outputT = inputT> extends Pipe<inputT, outputT> {
  defaultType?: T
  protected wrappedPipe: WrappedPipe<inputT, inputT, outputT, outputT>
  public ioPipe?: Pipe<inputT, outputT>
  private type: T

  constructor(type?: T) {
    super(type)
    this.type = type === undefined ? this.defaultType : type
    if (this.type === undefined)
      throw new Error('custom IO pipe instantiated with no type or default type')
  }

  abstract factory(T): CustomIOPipeFactoryResult
  protected makeWrappedPipe(type: T) {
    let customIO = this.factory(type),
      pipe = new ManualWrappedPipe<inputT, inputT, outputT, outputT>(
        this.ioPipe || new TransformPipe<inputT, outputT>(input => this.pipe(input))
      )
    pipe.beforeWrapping = new TransformPipe(input => customIO.input.call(customIO, input))
    pipe.afterWrapping = new TransformPipe(output => customIO.output.call(customIO, output))
    return pipe
  }

  run(input: inputT) {
    this.wrappedPipe = this.makeWrappedPipe(this.type)
    this.pipeOverride = this.wrappedPipe
    return super.run(input)
  }

  pipe(input: inputT) {
    return input as unknown as outputT
  }
}