import { Pipe } from '../../abstract'

export class PassThroughPipe<TInput = any, TOutput = TInput> extends Pipe<TInput, TOutput> {
  protected callback: Promise<any> | ((value: TInput) => any)
  init(callback?: Promise<any> | ((value: TInput) => any)) {
    super.init()
    this.callback = callback
    return this
  }

  makeOutput(input?: TInput) {
    let callback = this.callOrWaitForCallback(input)
    return callback instanceof Promise
      ? callback.then(() => input) as Promise<TOutput>
      : input as unknown as TOutput
  }

  private callOrWaitForCallback(input?: TInput) {
    let cb = this.callback
    if (cb instanceof Promise)
      return cb
    else if (cb instanceof Function)
      return cb(input)
    else
      return cb
  }
}