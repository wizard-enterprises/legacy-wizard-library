import { Pipe, PipeStatus, PipeOpts } from '../abstract'
import { Pipeline } from '..'

const makeFirstCharUpperCase = str => str.charAt(0).toUpperCase() + str.slice(1)

export abstract class PipeReporter<inputT = any, outputT = inputT> extends Pipeline<inputT, outputT> {
  constructor(pipe: Pipe, opts: PipeOpts = {}) {
    super([pipe], opts)
    if (pipe.status !== PipeStatus.unassembled)
      throw new Error('Cannot be created with an assembled or unassemblable pipe')
  }
  
  pipe(input: inputT): outputT | Promise<outputT> {
    let piped = super.pipe(input),
      getReport = () => this.report(this.initArgs[0])
    return piped instanceof Promise
      ? piped.then(getReport)
      : getReport()
  }

  protected abstract report(Pipe)
}

export abstract class PipelineReporter<inputT = any, outputT = inputT> extends PipeReporter<inputT, outputT> {
  public abstract types: any[]
  
  constructor(private pipeline: Pipeline, opts: PipeOpts = {}) {
    super(pipeline, opts)
  }
  
  _assemble() {
    this.prepareForTypes(this.types)
    super._assemble()
    this.assemblePipe(this.pipeline)
  }

  private prepareForTypes(types: any[]) {
    for (let method of this.getReportMethodsForTypes(types))
      if (this[method] === undefined) {
        this[method] = {[method]: function() {}}[method].bind(this)
      }
  }
  
  private getReportMethodsForTypes(types: any[]) {
    let relevantStati = [PipeStatus.piping, PipeStatus.piped]
        .map(status => PipeStatus[status])
        .map(makeFirstCharUpperCase),
      typeNames = types.map(type => makeFirstCharUpperCase(type.name)),
      methods = []
    for (let typeName of typeNames)
      for (let statusName of relevantStati)
        methods.push(`report${statusName}${typeName}`)
    return methods
  }

  private assemblePipe(pipe) {
    for (let type of this.types)
      if (pipe instanceof type) {
        let typeName = makeFirstCharUpperCase(type.name),
          self = this
        pipe.assembleInputHook(() =>
          self[`reportPiping${typeName}`](pipe))
        pipe.assembleOutputHook(() =>
          self[`reportPiped${typeName}`](pipe))
        break
      }
    if (pipe instanceof Pipeline)
      this.assemblePipeline(pipe)
  }

  private assemblePipeline(pipeline) {
    for (let pipe of pipeline.pipes)
      this.assemblePipe(pipe)
  }

  report(pipe) {
    return this.reportSummary(pipe)
  }

  protected reportSummary(pipe) {

  }
}