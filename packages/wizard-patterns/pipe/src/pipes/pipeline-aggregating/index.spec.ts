import { SubSuite, TestSuite, Test } from 'polymorphic-tests'
import { BasePipelineSuite } from '../pipeline/pipelines/index.spec'
import { BasePipelineAggregatingPipe } from './abstract'
import { ChainingPipeline } from '../pipeline/pipelines/chaining'
import { CulminatingPipeline } from '../pipeline/pipelines/culminating'
import { OverflowingPipeline } from '../pipeline/pipelines/overflowing'
import { Pipes } from '../index.spec'

@SubSuite(Pipes) export class PipelineAggregating extends TestSuite {}

export abstract class PipelineAggregatingSuite extends BasePipelineSuite<BasePipelineAggregatingPipe> {
  @Test() async 'aggregate chaining pipeline'(t) {
    let pipeline = new ChainingPipeline().init(...this.makeTestPipes())
    t.expect(await this.pipe(0, pipeline)).to.deep.equal(this.getExpectedOutput(pipeline))
  }
  
  @Test() async 'aggregate culminating pipeline'(t) {
    let pipeline = new CulminatingPipeline().init(...this.makeTestPipes())
    t.expect(await this.pipe(0, pipeline)).to.deep.equal(this.getExpectedOutput(pipeline))
  }

  @Test() async 'aggregate overflowing pipeline'(t) {
    let pipeline = new OverflowingPipeline().init(...this.makeTestPipes())
    t.expect(await this.pipe(0, pipeline)).to.deep.equal(this.getExpectedOutput(pipeline))
  }

  abstract getExpectedOutput(pipeline)
}
