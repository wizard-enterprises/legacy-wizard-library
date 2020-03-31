import { Pipe } from '../../abstract'

export abstract class BasePipeline<TInput = any, TOutput = TInput, TPipe extends Pipe = Pipe> extends Pipe<TInput, TOutput> {
  public startFrom: number = 0
  public pipes: TPipe[]
  init(...pipes: TPipe[]) {
    super.init()
    this.pipes = pipes
    return this
  }

  protected makeOutput(input: TInput) {
    return this.makePipesOutput(input, this.getAssembledPipes(this.pipes))
  }
  protected abstract makePipesOutput(input: TInput, pipes: TPipe[])

  private getAssembledPipes(pipes: TPipe[]) {
    return this.assemblePipes(pipes)
  }

  protected assemblePipes(pipes: TPipe[]) {
    return pipes
  }
} 

export abstract class SequentialPipeline<TInput = any, TOutput = TInput, TPipe extends Pipe = Pipe> extends BasePipeline<TInput, TOutput, TPipe> {
  public startFrom: number = 0

  protected assemblePipes(pipes: TPipe[]) {
    if (pipes.length === 0 && this.startFrom === 0)
      return []
    this.verifyValidStartFrom(pipes)
    return pipes.slice(this.startFrom)
  }

  private verifyValidStartFrom(pipes) {
    if (this.startFrom >= pipes.length)
      throw new Error(`startFrom index ${this.startFrom} is out of bounds for pipe array of length ${this.pipes.length}`)
  }
}
