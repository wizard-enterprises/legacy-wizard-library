import { SubSuite, Test } from 'polymorphic-tests'
import { CulminatingPipeline } from '.'
import { Pipelines, SequentialPipelineSuite } from '../index.spec'
import { PassThroughPipe } from '../../../passthrough'
import { TransformPipe } from '../../../transform'

@SubSuite(Pipelines) class Culminating extends SequentialPipelineSuite<CulminatingPipeline> {
  protected underTest = CulminatingPipeline
  
  @Test() async 'culminate via side effects'(t) {
    let sideEffectCounter = 0,
      sideEffectPipe = new PassThroughPipe().init(() => sideEffectCounter++),
      pipeline = this.makePipe(
        ...Array(3).fill(sideEffectPipe),
        new TransformPipe().init(() => sideEffectCounter),
      )
    t.expect(await pipeline.run()).to.equal(3)
    t.expect(await pipeline.run()).to.equal(6)
  }
}