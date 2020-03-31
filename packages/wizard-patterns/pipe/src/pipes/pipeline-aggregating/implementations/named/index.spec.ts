import { NamedPipelineAggregatingPipe } from '.'
import { SubSuite, Test } from 'polymorphic-tests'
import { PipelineAggregating, PipelineAggregatingSuite } from '../../index.spec'
import { BasePipeline } from '../../../pipeline/abstract'
import { ChainingPipeline } from '../../../pipeline/pipelines/chaining'
import { CulminatingPipeline } from '../../../pipeline/pipelines/culminating'
import { OverflowingPipeline } from '../../../pipeline/pipelines/overflowing'
import { PassThroughPipe } from '../../../passthrough'

@SubSuite(PipelineAggregating) class Named extends PipelineAggregatingSuite {
  underTest = NamedPipelineAggregatingPipe

  @Test() async 'throw when getting unnamed pipes'(t) {
    let unnamedPipe = new PassThroughPipe().init(),
      nullNamedPipe = new PassThroughPipe().init(),
      emptyNamedPipe = new PassThroughPipe().init()
    nullNamedPipe.name = null
    emptyNamedPipe.name = ''
    for (let pipe of [unnamedPipe, nullNamedPipe, emptyNamedPipe])
      t.expect(() => this.makePipe(new ChainingPipeline().init(pipe))).to.throw('Initialized with unnamed pipe')
  }

  makeTestPipes(...args) {
    let pipes = super.makeTestPipes(...args)
    pipes.forEach(this.namePipe)
    return pipes
  }

  private namePipe(pipe, index) {
    let getPipeName = index => {
      switch (index) {
        case 0: return 'first'
        case 1: return 'second'
        case 2: return 'third'
      }
    }
    pipe.name = getPipeName(index)
  }

  getExpectedOutput(pipeline: BasePipeline) {
    if (pipeline instanceof ChainingPipeline)
      return {
        first: 10,
        second: 20,
        third: 30,
      }
    if (pipeline instanceof CulminatingPipeline
     || pipeline instanceof OverflowingPipeline)
      return {
        first: 10,
        second: 10,
        third: 10,
      }
  }
}