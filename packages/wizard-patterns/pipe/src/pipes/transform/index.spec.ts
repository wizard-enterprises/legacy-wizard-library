import { TransformPipe } from '.'
import { SubSuite, Test } from 'polymorphic-tests'
import { Pipes, PipeSuite } from '../index.spec'

@SubSuite(Pipes) class Transform extends PipeSuite<TransformPipe> {
  protected underTest = TransformPipe

  makeUnderTestPipe(args, opts) {
    return super.makeUnderTestPipe(args[0], opts)
  }

  @Test() async 'pass through transform'(t) {
    t.expect(await this.pipe(5, [x => x])).to.equal(5)
  }

  @Test() async 'simple transform'(t) {
    t.expect(await this.pipe(5, [x => x * x])).to.equal(25)
  }

  @Test() async 'wait for transform'(t) {
    t.expect(await this.pipe(5, [async x => x * x])).to.equal(25)
  }
}