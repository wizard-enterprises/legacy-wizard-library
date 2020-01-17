import { SubSuite, Test, TestSuite } from 'polymorphic-tests'
import { PipeReporter } from '.'
import { Pipe, PipeStatus } from '../abstract'
import { WizardPipeline } from '../index.spec'
import { Pipeline, TransformPipe } from '../pipes'

class _SimpleReporter extends PipeReporter {
  report({input, output}) {
    return `Input was ${input}, and output was ${output}`
  }
}

export class ReporterSuite extends TestSuite {
  protected pipe: Pipe
  protected Reporter: any = _SimpleReporter
  
  before(t) {
    super.before(t)
    this.pipe = new TransformPipe(x => x * x)
    this.makeReporter = this.makeReporter.bind(this)
  }

  @Test() 'throw if pipe is not unassembled'(t) {
    t.expect(this.makeReporter).not.to.throw()
    let expectMakeReporterToThrow = () =>
      t.expect(this.makeReporter)
        .to.throw('Cannot be created with an assembled or unassemblable pipe')
    this.pipe.assemble()
    expectMakeReporterToThrow()
    this.pipe.run(5)
    expectMakeReporterToThrow()
  }

  protected makeReporter(pipe: Pipe = this.pipe) {
    return new this.Reporter(pipe)
  }
}
  
@SubSuite(WizardPipeline) class SimpleReporter extends ReporterSuite {
  @Test() 'report simple pipe'(t) {
    let reporter = this.makeReporter().assemble()
    t.expect(reporter.status).to.equal(PipeStatus.clean)
    t.expect(reporter.run(1)).to.equal('Input was 1, and output was 1')
    t.expect(reporter.run(2)).to.equal('Input was 2, and output was 4')
    t.expect(reporter.status).to.equal(PipeStatus.piped)
  }

  @Test() 'reports pipeline stupidly'(t) {
    this.pipe = new Pipeline(Array.from(Array(3), () =>
      new TransformPipe(x => x * x)))
    let reporter = this.makeReporter().assemble()
    t.expect(reporter.run(1)).to.equal('Input was 1, and output was 1')
    t.expect(reporter.run(2)).to.equal('Input was 2, and output was 256')
  }
}
