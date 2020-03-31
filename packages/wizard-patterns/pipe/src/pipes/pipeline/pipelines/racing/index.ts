import { Pipe } from '../../../../abstract'
import { BasePipeline } from '../../abstract'

export class RacingPipeline<TInput = any, TOutput = TInput, TPipe extends Pipe = Pipe> extends BasePipeline<TInput, TOutput, TPipe> {
  async makePipesOutput(input: TInput, pipes: TPipe[]) {
    return pipes.length
      ? Promise.race(pipes.map(pipe => pipe.run(input)))
      : Promise.resolve(input)
  }
}