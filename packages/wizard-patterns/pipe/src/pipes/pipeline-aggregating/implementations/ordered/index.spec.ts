import { SubSuite } from 'polymorphic-tests'
import { OrderedPipelineAggregatingPipe } from '.'
import { ChainingPipeline } from '../../../pipeline/pipelines/chaining'
import { CulminatingPipeline } from '../../../pipeline/pipelines/culminating'
import { OverflowingPipeline } from '../../../pipeline/pipelines/overflowing'
import { PipelineAggregating, PipelineAggregatingSuite } from '../../index.spec'

@SubSuite(PipelineAggregating) class Ordered extends PipelineAggregatingSuite {
  underTest = OrderedPipelineAggregatingPipe

  getExpectedOutput(pipeline) {
    if (pipeline instanceof ChainingPipeline)
      return [10, 20, 30]
    if (pipeline instanceof CulminatingPipeline
     || pipeline instanceof OverflowingPipeline)
      return [10, 10, 10]
  }
}