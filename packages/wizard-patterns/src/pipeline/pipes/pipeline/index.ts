import { Pipe } from '../..'

export class Pipeline<inputT = any, outputT = inputT, P extends Pipe = Pipe> extends Pipe<inputT, outputT, P[]> {
  public startFrom: number = 0
  public pipes: P[]
  constructor(...pipes: P[]) {
    super(pipes)
    this.pipes = pipes
  }

  pipe(initial?: inputT) {
    if (this.startFrom > this.pipes.length)
      throw new Error(`startFrom index ${this.startFrom} is out of bounds for pipe array of length ${this.pipes.length}`)
    let value: any = initial,
      pipesToRun = [...Array(this.startFrom).fill(null), ...this.pipes.slice(this.startFrom)]
    if (this.startFrom === this.pipes.length) {
      value = this.pipes[this.pipes.length - 1].output
      value = [undefined, null].includes(value) ? initial : value
    } else
      for (let [iS, pipe] of Object.entries(pipesToRun)) {
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
    return value as outputT
  }
}
