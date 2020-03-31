import { SubSuite } from 'polymorphic-tests'
import { ChainingPipeline } from '.'
import { Pipelines, SequentialPipelineSuite } from '../index.spec'

@SubSuite(Pipelines) class Chaining extends SequentialPipelineSuite<ChainingPipeline> {
  protected underTest = ChainingPipeline
  
  protected getExpectedOutput(input, relevantPipes, pipeline) {
    return relevantPipes
      .reduce((acc, pipe) =>
        acc + (pipe instanceof this.underTest
          ? this.getExpectedOutput(0, this.getRelevantPipes(pipe), pipe)
          : this.makeTestPipeOutput(0))
        , input)
  }

  protected makeTestPipeOutput(input) {
    return input + 10
  }
}