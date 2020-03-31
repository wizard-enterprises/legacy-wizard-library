import { BehaviorSubject } from 'rxjs'
import { Pipe } from '../../abstract'

export class ManualPipe<TInput = any, TOutput = TInput> extends Pipe<TInput, TOutput> {
  // public input: TInput
  // public output: TOutput
  private subject: BehaviorSubject<TOutput>
  
  makeOutput(input: TInput) {
    // console.log('manual pipe input', input)
    // this.input = input
    this.subject = new BehaviorSubject<TOutput>(null)
    return this.subject.toPromise()
    // return new Promise((resolve, reject) => {
    //   this._next = resolve
    //   this.reject = reject
    //   this.input = input
    // }) as Promise<TOutput>
  }

  // private _next: (TOutput) => void
  // private reject: (Error) => void

  async next(output: TOutput) {
    // console.log('manual pipe output', output)
    // this.output = output
    this.subject.next(output)
    this.subject.complete()
    // ensures deconstructed promise resolves in time
    // await new Promise(res => setTimeout(res, 0))
    return output
  }
}