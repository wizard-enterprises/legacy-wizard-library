import { Pipe } from '../../../../abstract'
import { BasePipeline } from '../../abstract'

export class OverflowingPipeline<TInput = any, TOutput = TInput, TPipe extends Pipe = Pipe> extends BasePipeline<TInput, TOutput, TPipe> {
  async makePipesOutput(input: TInput, pipes: TPipe[]) {
    let lastResolve = input
    await Promise.all(pipes.map(pipe =>
      pipe.run(input).then(x => lastResolve = x)))
    return lastResolve
  }
}