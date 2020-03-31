import { Pipe } from '../../abstract'
import { Pipeline } from '../pipeline'
import { TransformPipe } from '../transform'

export interface CustomIOPipeFactoryResult<TInput = any, TOutput = TInput> {
  input(TInput?: TInput): TInput
  output(TOutput?: TOutput): TOutput
}

export abstract class CustomIOPipe<T, TInput = any, TOutput = TInput, TPipe extends Pipe = Pipe> extends Pipeline<TInput, TOutput, TPipe> {
  defaultType?: T
  protected assemblable = true
  protected shouldAssembleOnRun = true
  protected type: T

  constructor(type?: T) {
    super()
    this.type = type === undefined ? this.defaultType : type
    if (this.type === undefined)
      throw new Error('custom IO pipe instantiated with no type or default type')
  }

  abstract factory(T): CustomIOPipeFactoryResult
  protected assemblePipes(pipes: TPipe[]) {
    let customIO = this.factory(this.type)

    return [
      new TransformPipe().init(input => customIO.input(input)),
      ...super.assemblePipes(pipes),
      new TransformPipe().init(output => customIO.output(output)),
    ] as TPipe[]
  }
}