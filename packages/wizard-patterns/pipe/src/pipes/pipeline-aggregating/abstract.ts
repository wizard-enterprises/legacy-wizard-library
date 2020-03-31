import { Pipe } from '../../abstract'
import { BasePipeline } from '../pipeline/abstract'

export type PipeInPipeline<TPipeline extends BasePipeline = BasePipeline> = TPipeline extends {pipes: (infer U)[]} ? U : never

export abstract class BasePipelineAggregatingPipe<TInput = any, TOutput = TInput, TPipeline extends BasePipeline = BasePipeline> extends BasePipeline<TInput, TOutput, TPipeline> {
  public init(pipeline: TPipeline) {
    return super.init(pipeline)
  }

  async makePipesOutput(input: TInput, [pipeline]: [TPipeline]) {
    await pipeline.run(input)
    return this.aggregateFinishedPipeline(pipeline) 
  }

  protected abstract aggregateFinishedPipeline(pipeline: TPipeline): TOutput

  protected getPipeOutput(pipe: PipeInPipeline<TPipeline>): PipeInPipeline<TPipeline>['output'] {
    return pipe.output as typeof pipe.output
  }
}
