// import { SubSuite, Test } from 'polymorphic-tests'
// import { PipelineReporter } from '.'
// import { Pipe } from '../abstract'
// import { WizardPipeline } from '../index.spec'
// import { Pipeline, TransformPipe } from '../pipes'
// import { ReporterSuite } from './pipe.spec'

// class _PipelineReporter extends PipelineReporter {
//   public reports: string[] = []
//   public types = [Pipeline, Pipe]

//   reportSummary() {
//     return this.reports
//   }
  
//   reportPipingPipeline(pipeline) {
//     this.reports.push(`${this.getPipelineName(pipeline)} start with input ${pipeline.input}`)
//   }
  
//   reportPipedPipe(pipe) { 
//     this.reports.push(`pipe ran with input ${pipe.input} and output ${pipe.output}`)
//   }

//   reportPipedPipeline(pipeline) {
//     this.reports.push(`${this.getPipelineName(pipeline)} end with output ${pipeline.output}`)
//   }
  
//   private getPipelineName(pipeline) {
//     return pipeline === this.pipes[0] ? 'pipeline' : 'sub-pipeline'
//   }
// }

// export class PipelineReporterSuite extends ReporterSuite {
//   protected Reporter = _PipelineReporter
// }

// @SubSuite(WizardPipeline) class SimplePipelineReporter extends PipelineReporterSuite {
//   @Test() 'empty pipeline'(t) {
//     t.expect(this.makeReporter(new Pipeline).run(5)).to.deep.equal([
//       `pipeline start with input 5`,
//       `pipeline end with output 5`,
//     ])
//   }

//   @Test() 'pipeline with pipes'(t) {
//     this.pipe = new Pipeline(Array.from({length: 3}, () =>
//       new TransformPipe(x => x * x)))
//     t.expect(this.makeReporter().run(2)).to.deep.equal([
//       `pipeline start with input 2`,
//       `pipe ran with input 2 and output 4`,
//       `pipe ran with input 4 and output 16`,
//       `pipe ran with input 16 and output 256`,
//       `pipeline end with output 256`,
//     ])
//   }

//   @Test() 'pipeline with subpipelines'(t) {
//     let makeTransformPipe = () => new TransformPipe(x => x + x)
//     this.pipe = new Pipeline([
//       makeTransformPipe(),
//       new Pipeline(Array.from({length: 3}, makeTransformPipe)),
//       makeTransformPipe(),
//     ])
//     t.expect(this.makeReporter(this.pipe).run(2)).to.deep.equal([
//       `pipeline start with input 2`,
//       `pipe ran with input 2 and output 4`,
//       `sub-pipeline start with input 4`,
//       `pipe ran with input 4 and output 8`,
//       `pipe ran with input 8 and output 16`,
//       `pipe ran with input 16 and output 32`,
//       `sub-pipeline end with output 32`,
//       `pipe ran with input 32 and output 64`,
//       `pipeline end with output 64`,
//     ])
//   }
// }
