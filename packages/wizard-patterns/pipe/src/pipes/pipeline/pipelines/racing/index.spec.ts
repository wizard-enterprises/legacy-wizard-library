import { SubSuite, Test } from 'polymorphic-tests'
import { RacingPipeline } from '.'
import { Pipelines, PipelineSuite } from '../index.spec'
import { TransformPipe } from '../../../transform'

@SubSuite(Pipelines) class Racing extends PipelineSuite<RacingPipeline> {
  protected underTest = RacingPipeline

  @Test() async 'resolve with quickest pipe regardless of placement'(t) {
    let makeDelayedPipe = (delay, value) => new TransformPipe().init(() =>
        new Promise(res => setTimeout(() => res(value), delay))),
      pipeline = this.makePipe(
        makeDelayedPipe(10, 'first'),
        makeDelayedPipe(1, 'second'),
        makeDelayedPipe(10, 'third'),
      )
    t.expect(await pipeline.run()).to.equal('second')
  }
}
