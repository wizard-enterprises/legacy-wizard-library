import { Suite, Test, TestSuite, SubSuite } from 'polymorphic-tests'
import { ManualPipe } from '.'
import { Pipe, PipeStatus } from '../abstract'
import { WizardPipeline } from '../index.spec'

@SubSuite(WizardPipeline) export class Pipes extends TestSuite {}

export abstract class PipeSuite<UnderTest extends Pipe = Pipe> extends TestSuite {
  protected abstract underTest: new (...args: any[]) => UnderTest

  protected lastPipe: UnderTest = null
  protected pipe(input?, pipeArgs = undefined, pipeOpts = {}) {
    return (this.lastPipe || this.makePipeAndSetLast(false, pipeArgs, pipeOpts)).run(input)
  }

  protected makePipe(pipeArgs = undefined, pipeOpts = {}) {
    return this.makePipeAndSetLast(true, pipeArgs, pipeOpts)
  }

  private makePipeAndSetLast(shouldSetLast: boolean, pipeArgs, pipeOpts) {
    let pipe = this.makeUnderTestPipe(pipeArgs, pipeOpts)
    if (shouldSetLast) this.lastPipe = pipe
    return pipe
  }
  
  protected makeUnderTestPipe(pipeArgs, pipeOpts) {
    return new this.underTest(pipeArgs, pipeOpts)
  }
}

@Suite() class PipeStatusTracking extends PipeSuite<ManualPipe> {
  underTest = ManualPipe

  @Test() async 'track pipe status'(t) {
    let pipe = this.makePipe()
    t.expect(pipe.status).to.equal(PipeStatus.unassembled)
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
    await pipe.waitForStatus(PipeStatus.unassembled)
    pipe.run(5)
    await pipe.waitForStatus(PipeStatus.piping)
    await pipe.next(pipe.input + 10)
    await pipe.waitForStatus(PipeStatus.piped)
  }
} 