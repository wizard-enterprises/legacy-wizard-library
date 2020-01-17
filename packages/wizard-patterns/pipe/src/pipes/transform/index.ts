import { Pipe, PipeOpts } from '../../abstract'

export class TransformPipe<inputT = any, outputT = inputT> extends Pipe<inputT, outputT, (value: inputT) => outputT | Promise<outputT>> {
  constructor(protected transformFunc: (value: inputT) => outputT | Promise<outputT>, opts: PipeOpts = {}) {
    super(transformFunc, opts)
  }

  pipe(value?: inputT) {
    return this.transformFunc(value)
  }
}