import { Test, TestSuite, Suite } from 'polymorphic-tests'
import { PassThroughPipe, TransformPipe } from '../..'
import { PipeSuite } from '../../index.spec'
import { BasePipeline, SequentialPipeline } from '../abstract'

@Suite() export class Pipelines extends TestSuite {}

export abstract class BasePipelineSuite<TPipeline extends BasePipeline> extends PipeSuite<TPipeline> {
  protected makeTestPipes(beAsync = false) {
    return Array.from({length: 3}, () =>
      new TransformPipe().init(x => beAsync
        ? new Promise(res => setTimeout(() => res(this.makeTestPipeOutput(x)), 1))
        : this.makeTestPipeOutput(x)))
  }

  protected makeTestPipeOutput(input) {
    return input + 10
  }
}

export abstract class PipelineSuite<TPipeline extends BasePipeline> extends BasePipelineSuite<TPipeline> {
  private shouldMakePipe = true

  before(t) {
    super.before(t)
    t.expectWorkingPipeline = async (input, ...pipelineArgs) => {
      let pipeline = this.shouldMakePipe
          ? this.makePipe(...pipelineArgs)
          : pipelineArgs[0],
        expectedOutput = this.getExpectedOutput(input, this.getRelevantPipes(pipeline), pipeline)
      await t.expect(pipeline.run(input)).to.eventually.equal(expectedOutput)
    }
    t.expectWorkingPipeline.asGiven = (input, pipeline) => {
      this.shouldMakePipe = false
      return t.expectWorkingPipeline(input, pipeline)
    }
  }

  protected getRelevantPipes(pipeline) {
    return pipeline.pipes
      .filter(pipe => pipe instanceof PassThroughPipe === false)
      .slice(pipeline.startFrom)
  }

  @Test() async 'run empty pipeline'(t) {
    await t.expectWorkingPipeline(1)
  }

  @Test() async 'run pipeline with only passthrough'(t) {
    await t.expectWorkingPipeline(1, new PassThroughPipe().init())
  }
  
  @Test() async 'run pipeline'(t) {
    await t.expectWorkingPipeline(1, ...this.makeTestPipes())
    await t.expectWorkingPipeline(100, ...this.makeTestPipes())
  }
  
  @Test() async 'run async pipeline'(t) {
    await t.expectWorkingPipeline(1, ...this.makeTestPipes(true))
    await t.expectWorkingPipeline(100, ...this.makeTestPipes(true))
  }

  @Test() async 'run pipeline of pipelines'(t) {
    let args = Array.from({length: 3}, () =>
      this.makePipe(...this.makeTestPipes()))
    await t.expectWorkingPipeline(1, ...args)
    await t.expectWorkingPipeline(100, ...args)
  }

  protected getExpectedOutput(input, relevantPipes, pipeline) {
    return relevantPipes.length === 0
      ? input
      : this.makeTestPipeOutput(input)
  }
}

export abstract class SequentialPipelineSuite<TPipeline extends SequentialPipeline> extends PipelineSuite<TPipeline> {
  @Test() async 'run pipeline from middle'(t) {
    let makePipe = startFrom => {
      let pipe = this.makePipe(...this.makeTestPipes(true))
      pipe.startFrom = startFrom
      return pipe
    }
    await t.expect(t.expectWorkingPipeline.asGiven(0, makePipe(4))).to.eventually.be.rejectedWith(`startFrom index 4 is out of bounds for pipe array of length 3`)
    await t.expect(t.expectWorkingPipeline.asGiven(0, makePipe(3))).to.eventually.be.rejectedWith(`startFrom index 3 is out of bounds for pipe array of length 3`)
    await t.expectWorkingPipeline.asGiven(0, makePipe(2))
    await t.expectWorkingPipeline.asGiven(0, makePipe(1))
    await t.expectWorkingPipeline.asGiven(0, makePipe(0))
  }
}