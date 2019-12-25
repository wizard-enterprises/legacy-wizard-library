import { Pipe } from '../..'

export class TransformPipe<inputT = any, outputT = inputT> extends Pipe<inputT, outputT, (value: inputT) => outputT | Promise<outputT>> {
  constructor(protected transformFunc: (value: inputT) => outputT | Promise<outputT>) {
    super(transformFunc)
  }

  pipe(value?: inputT) {
    return this.transformFunc(value)
  }
}