import { SubSuite, Test } from 'polymorphic-tests'
import { Pipes, PipeSuite } from '../index.spec'
import { ManualPipe } from '.'

@SubSuite(Pipes) class Manual extends PipeSuite<ManualPipe> {
  protected underTest = ManualPipe

  @Test() async 'manually continue pipe'(t) {
    let pipe = this.makePipe(),
      pipeProm = pipe.run(5)
    t.expect(pipeProm).to.be.an.instanceof(Promise)
    t.expect(pipe.input).to.equal(5)
    t.expect(await pipe.next(pipe.input + 5)).to.equal(10)
    t.expect(pipe.output).to.equal(10)
    t.expect(await pipeProm).to.equal(10)
  }
}