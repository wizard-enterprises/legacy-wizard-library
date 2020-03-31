import { SequentialPipeline } from '../../abstract'
import { Pipe } from '../../../../abstract'

export class CulminatingPipeline<TInput = any, TOutput = TInput, TPipe extends Pipe = Pipe> extends SequentialPipeline<TInput, TOutput, TPipe> {
  async makePipesOutput(input: TInput, pipes: TPipe[]) {
    let value = input
    for (let pipe of pipes)
      value = await pipe.run(input)
    return value
  }
}