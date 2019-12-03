import { TransformPipe } from '.'
import { SubSuite, Test } from 'polymorphic-tests'
import { Pipes, PipeSuite } from '../index.spec'

@SubSuite(Pipes) class Transform extends PipeSuite<TransformPipe> {
  protected underTest = TransformPipe

  @Test() 'pass through transform'(t) {
    t.expect(this.pipe(5, x => x)).to.equal(5)
  }

  @Test() 'simple transform'(t) {
    t.expect(this.pipe(5, x => x * x)).to.equal(25)
  }

  @Test() async 'wait for transform'(t) {
    t.expect(await this.pipe(5, async x => x * x)).to.equal(25)
  }

  @Test() async 'transform to promise'(t) {
    t.expect(this.pipe(5, async x => x, {waitForAsync: false})).to.be.an.instanceof(Promise)
  }
}