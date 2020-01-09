import { Pipe, PipeOpts } from '../..'
type PipelineOpts = PipeOpts & {}

export class Pipeline<inputT = any, outputT = inputT, P extends Pipe = Pipe, assemblyDelegateT = any> extends Pipe<inputT, outputT, P[], PipelineOpts> {
  public startFrom: number = 0
  private _pipes: P[]
  get pipes() {
    return this._pipes
      || (this._pipes = this.initArgs as P[])
  }
  set pipes(pipes: P[]) {
    this._pipes = pipes
  }

  protected makeAssemblyDelegate(): any {
    return {
      assembleInputHook: this.assembleInputHook.bind(this),
      assembleOutputHook: this.assembleOutputHook.bind(this),
    }
  }

  protected _assemble() {
    for (let pipe of this.pipes)
      pipe.beAssembled(this.makeAssemblyDelegate())
  }

  pipe(initial?: inputT) {
    this.verifyValidStartFrom()
    return <outputT>(this.shouldStartAtEnd()
      ? this.getPipelineEndOutput(initial)
      : this.runPipes(initial))
  }

  private verifyValidStartFrom() {
    if (this.startFrom > this.pipes.length)
      throw new Error(`startFrom index ${this.startFrom} is out of bounds for pipe array of length ${this.pipes.length}`)
  }

  private getPipesForRun() {
    return [
      ...Array(this.startFrom).fill(null),
      ...this.pipes.slice(this.startFrom),
    ]
  }

  private shouldStartAtEnd() {
    return this.startFrom === this.pipes.length
  }

  private getPipelineEndOutput(defaultValue) {
    let value = this.pipes[this.pipes.length - 1].output
    return [undefined].includes(value) ? defaultValue : value
  }

  private runPipes(input) {
    let value = input
    for (let [iS, pipe] of Object.entries(this.getPipesForRun())) {
      if (pipe === null) continue
      let i = Number(iS)
      value = pipe.run(value)
      if (value instanceof Promise && this.waitForAsync) {
        return this.pipes.slice(i + 1)
          .reduce((acc, pipe) =>
            acc.then(value =>
              pipe.run(value)),
            value)
      }
    }
    return value
  }
}
