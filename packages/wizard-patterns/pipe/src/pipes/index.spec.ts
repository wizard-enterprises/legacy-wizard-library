import { Suite, Test, TestSuite } from 'polymorphic-tests'
import { ManualPipe } from '.'
import { Pipe, PipeStatus } from '../abstract'

@Suite() export class Pipes extends TestSuite { }

export abstract class PipeSuite<UnderTest extends Pipe = Pipe> extends TestSuite {
  protected abstract underTest: new (...args: any[]) => UnderTest

  protected lastPipe: UnderTest = null
  protected pipe(input?, ...initArgs: any[]) {
    let pipe = this.lastPipe ?? this.makePipeAndSetLast(false, ...initArgs)
    return pipe.run(input)
  }

  protected makePipe(...initArgs: any[]) {
    return this.makePipeAndSetLast(true, ...initArgs)
  }

  private makePipeAndSetLast(shouldSetLast: boolean, ...initArgs: any[]) {
    let pipe = this.makeUnderTestPipe(initArgs)
    if (shouldSetLast) this.lastPipe = pipe
    return pipe
  }

  protected makeUnderTestPipe(initArgs: any[], ctorArgs: any[] = []) {
    //@ts-ignore
    return new this.underTest(...ctorArgs).init(...initArgs)
  }
}

@Suite() class PipeStatusTracking extends PipeSuite<ManualPipe> {
  underTest = ManualPipe

  @Test() async 'track pipe status'(t) {
    let pipe = this.makePipe()
    t.expect(pipe['statusSubject'].value).to.equal(PipeStatus.clean)
    for (let i of [1, 2]) {
      let runProm = pipe.run(5 + i)
      t.expect(pipe['statusSubject'].value).to.equal(PipeStatus.piping)
      await pipe.next(pipe.input + 10)
      t.expect(pipe['statusSubject'].value).to.equal(PipeStatus.piped)
      t.expect(await runProm).to.equal(15 + i)
    }
  }

  @Test() async 'wait for status'(t) {
    t.timeout = 50
    let pipe = this.makePipe()
    await pipe.waitForStatus(PipeStatus.clean)
    pipe.run(5)
    await pipe.waitForStatus(PipeStatus.piping)
    t.expect(pipe.input).to.equal(5)
    await pipe.next(pipe.input + 10)
    await pipe.waitForStatus(PipeStatus.piped)
    t.expect(pipe.output).to.equal(15)
  }
} 