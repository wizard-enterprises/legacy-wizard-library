import { BasePipeline } from '../../../pipeline/abstract'
import { BasePipelineAggregatingPipe, PipeInPipeline } from '../../abstract'

export class OrderedPipelineAggregatingPipe<TInput = any, TPipeline extends BasePipeline = BasePipeline> extends BasePipelineAggregatingPipe<TInput, PipeInPipeline<TPipeline>['output'], TPipeline> {
  protected aggregateFinishedPipeline(pipeline: TPipeline) {
    return pipeline.pipes.map(pipe => this.getPipeOutput(pipe as PipeInPipeline<TPipeline>))
  }
}