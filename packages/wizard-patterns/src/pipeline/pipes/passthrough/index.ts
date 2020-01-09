import { Pipe, PipeOpts } from '../..'

export class PassThroughPipe<inputT = any, outputT = inputT> extends Pipe<inputT, outputT, Promise<any> | ((value: inputT) => any)> {
  constructor(protected callback?: Promise<any> | ((value: inputT) => any), opts: PipeOpts = {}) {
    super(callback, opts)
  }

  pipe(input?: inputT) {
    let callback = this.callOrWaitForCallback(input)
    return callback instanceof Promise
      ? callback.then(() => input) as Promise<outputT>
      : input as unknown as outputT
  }

  private callOrWaitForCallback(input?: inputT) {
    let cb = this.callback
    if (cb instanceof Promise)
      return cb
    else if (cb instanceof Function)
      return cb(input)
    else
      return cb
  }
}