import { SubSuite, Test } from 'polymorphic-tests'
import { OverflowingPipeline } from '.'
import { Pipelines, PipelineSuite } from '../index.spec'
import { TransformPipe } from '../../../transform'

@SubSuite(Pipelines) class Overflowing extends PipelineSuite<OverflowingPipeline> {
  protected underTest = OverflowingPipeline

  @Test() async 'resolve with slowest pipe regardless of placement'(t) {
    let makeDelayedPipe = (delay, value) => new TransformPipe().init(() =>
        new Promise(res => setTimeout(() => res(value), delay))),
      pipeline = this.makePipe(
        makeDelayedPipe(1, 'first'),
        makeDelayedPipe(10, 'second'),
        makeDelayedPipe(1, 'third'),
      )
    t.expect(await pipeline.run()).to.equal('second')
  }
}
