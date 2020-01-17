import { Pipe } from '../../abstract'

export class ManualPipe<inputT = any, outputT = inputT> extends Pipe<inputT, outputT> {
  public input: inputT
  
  pipe(input: inputT) {
    return new Promise((resolve, reject) => {
      this._next = resolve
      this.reject = reject
      this.input = input
    }) as Promise<outputT>
  }

  private _next: (outputT) => void
  private reject: (Error) => void

  async next(output: outputT) {
    this._next(output)
    // ensures deconstructed promise resolves in time
    await new Promise(res => setTimeout(res, 0))
    return output
  }
}