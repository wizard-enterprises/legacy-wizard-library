import { BasePipeline } from '../../../pipeline/abstract'
import { BasePipelineAggregatingPipe, PipeInPipeline } from '../../abstract'

type NamedPipeInPipeline<TPipeline extends BasePipeline = BasePipeline> = PipeInPipeline<TPipeline> & {name: string}
export class NamedPipelineAggregatingPipe<TInput = any, TPipeline extends BasePipeline = BasePipeline> extends BasePipelineAggregatingPipe<TInput, NamedPipeInPipeline<TPipeline>['output'], TPipeline> {
  public init(pipeline: TPipeline) {
    if (pipeline.pipes.find(pipe => !pipe.name))
      throw new Error('Initialized with unnamed pipe')
    return super.init(pipeline)
  }
  
  protected aggregateFinishedPipeline(pipeline: TPipeline) {
    let pipes = pipeline.pipes as NamedPipeInPipeline<typeof pipeline>[] 
    return pipes.reduce((acc, pipe: NamedPipeInPipeline<TPipeline>) =>
      ({...acc, [pipe.name]: this.getPipeOutput(pipe as NamedPipeInPipeline<TPipeline>)})
    , {})
  }
}