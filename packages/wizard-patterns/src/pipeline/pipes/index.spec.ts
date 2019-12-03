import { SubSuite, Suite, Test, TestSuite } from 'polymorphic-tests'
import { ManualPipe } from '.'
import { Pipe, PipeStatus } from '..'

@Suite() export class Pipes extends TestSuite {}

export abstract class PipeSuite<UnderTest extends Pipe = Pipe> extends TestSuite {
  protected abstract underTest: new (...args: any[]) => UnderTest

  protected lastPipe: UnderTest = null
  protected pipe(input?, ...pipeArgs) {
    return (this.lastPipe || this.makePipeAndSetLast(false, ...pipeArgs)).run(input)
  }

  protected makePipe(...pipeArgs) {
    return this.makePipeAndSetLast(true, ...pipeArgs)
  }

  private makePipeAndSetLast(shouldSetLast: boolean, ...pipeArgs) {
    let pipe = this.makeUnderTestPipe(...pipeArgs)
    if (shouldSetLast) this.lastPipe = pipe
    return pipe
  }

  protected makeUnderTestPipe(...pipeArgs) {
    return new this.underTest(...pipeArgs)
  }
}

@Suite() class PipeStatusTracking extends PipeSuite<ManualPipe> {
  underTest = ManualPipe

  @Test() async 'track pipe status'(t) {
    let pipe = this.makePipe()
    t.expect(pipe.status).to.equal(PipeStatus.clean)
    for (let i of [1, 2]) {
      let runProm = pipe.run(5 + i)
      t.expect(pipe.status).to.equal(PipeStatus.piping)
      await pipe.next(pipe.input + 10)
      t.expect(pipe.status).to.equal(PipeStatus.piped)
      t.expect(await runProm).to.equal(15 + i)
    }
  }

  @Test() async 'wait for status'(t) {
    t.timeout = 50
    let pipe = this.makePipe()
    await pipe.waitForStatus(PipeStatus.clean)
    pipe.run(5)
    await pipe.waitForStatus(PipeStatus.piping)
    await pipe.next(pipe.input + 10)
    await pipe.waitForStatus(PipeStatus.piped)
  }
} 