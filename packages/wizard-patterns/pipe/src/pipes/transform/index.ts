import { Pipe } from '../../abstract'

export class TransformPipe<TInput = any, TOutput = TInput> extends Pipe<TInput, TOutput> {
  protected transformFunc: (value: TInput) => TOutput | Promise<TOutput>
  init(transformFunc?: (value: TInput) => TOutput | Promise<TOutput>) {
    super.init()
    if (transformFunc) this.transformFunc = transformFunc
    return this
  }

  makeOutput(value?: TInput) {
    let transformFunc = this.transformFunc ?? (x => x as unknown as TOutput)
    return transformFunc(value)
  }
}