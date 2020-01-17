import { CachedReturn } from 'wizard-decorators'

export enum PipeStatus {
  unassembled = -2,
  clean = -1,
  piping = 0,
  piped = 1,
}

export type PipeOpts = {
  waitForAsync?: boolean
}

export abstract class Pipe<inputT = any, outputT = inputT, initArgsT extends any = any, initOptsT extends PipeOpts = PipeOpts> {
  public waitForAsync: boolean = true
  public input: inputT
  public output: outputT
  public readonly initArgs: Partial<initArgsT> = {}
  public readonly initOpts: Partial<initOptsT> = {}
  
  constructor(args?: initArgsT, opts?: initOptsT) {
    this.initArgs = args || []
    this.initOpts = opts || {}
    this.parseInitOpts(this.initOpts)
  }
  
  protected parseInitOpts(opts: Partial<initOptsT>) {
    if (opts.waitForAsync !== undefined)
      this.waitForAsync = opts.waitForAsync
  }

  protected readonly assemblable: boolean = true
  protected readonly shouldAssembleOnRun: boolean = true
  @CachedReturn protected get initialStatus(): PipeStatus {
    return this.assemblable
      ? PipeStatus.unassembled
      : PipeStatus.clean
  }
  @CachedReturn private get statusWaiters() {
    return new PipeStatusWaiters(this.initialStatus)
  }
  private _status: PipeStatus
  public get status() {
    if (this._status === undefined)
      this._status = this.initialStatus
    return this._status
  }

  public set status(status) {
    this._status = status
    this.statusWaiters.setStatus(status)
  }

  public waitForStatus(status: PipeStatus) {
    return this.statusWaiters.waitFor(status)
  }

  public beAssembled(delegate: any) {}

  public assemble() {
    this.verifyAssemblability()
    this._assemble()
    this.status = PipeStatus.clean
    return this
  }

  private assembledInputHooks: Array<(inputT) => any> = []
  protected assembleInputHook(cb: (inputT) => any) { this.addAssembledHook(cb, this.assembledInputHooks) }
  private runAssembledInputHooks(input: inputT) { this.runAssembledHooks(input, this.assembledInputHooks) }
  private assembledOutputHooks: Array<(inputT) => any> = []
  protected assembleOutputHook(cb: (outputT) => any) { this.addAssembledHook(cb, this.assembledOutputHooks) }
  private runAssembledOutputHooks(output: outputT) { this.runAssembledHooks(output, this.assembledOutputHooks) }
  private addAssembledHook(hook, hooks) {
    this.verifyAssemblability()
    hooks.push(hook)
  }
  private runAssembledHooks(value, hooks) {
    for (let hook of hooks) hook(value)
  }

  private verifyAssemblability() {
    if (this.assemblable === false || this.status !== PipeStatus.unassembled)
      throw new Error(`Can't assemble assembled pipe`)
  }

  protected _assemble(): void {}

  public run(input?: inputT): outputT | Promise<outputT> {
    this.startRun(input)
    let piped = this.pipeOverride ? this.pipeOverride.run(input) : this.pipe(input)
    return this.shouldWaitFor(piped)
      ? piped.then(output => this.endRun(output))
      : this.endRun(piped)
  }
  
  protected startRun(input: inputT) {
    this.assembleIfShould()
    this.input = input
    this.status = PipeStatus.piping
    this.runAssembledInputHooks(this.input)
  }

  private assembleIfShould() {
    let shouldAssemble = this.assemblable
      && this.shouldAssembleOnRun
      && this.status === PipeStatus.unassembled
    if (shouldAssemble)
      this.assemble()
  }

  protected shouldWaitFor(thing: outputT | Promise<outputT>): thing is Promise<outputT> {
    return thing instanceof Promise && this.waitForAsync
  }

  private endRun(output: outputT) {
    this.output = output
    this.status = PipeStatus.piped
    this.runAssembledOutputHooks(this.output)
    return output
  }

  protected pipeOverride?: Pipe<inputT, outputT>
  abstract pipe(value: inputT): Promise<outputT> | outputT
}

class PipeStatusWaiters {
  private waiters = {}
  constructor (private currentStatus: PipeStatus) {}

  public waitFor(status: PipeStatus) {
    if (status === this.currentStatus) return Promise.resolve()
    if (!this.waiters[status]) this.setupStatusWaitersFor(status)
    return this.waiters[status].promise
  }

  public setStatus(status: PipeStatus) {
    this.updateStatusWaiters(this.currentStatus, status)
    this.currentStatus = status
  }

  private updateStatusWaiters(prevStatus: PipeStatus, newStatus: PipeStatus) {
    this.setupStatusWaitersFor(prevStatus)
    if (this.waiters[newStatus]) this.waiters[newStatus].resolver()
  }

  private setupStatusWaitersFor(status: PipeStatus) {
    let resolver, promise = new Promise(res => resolver = res)
    this.waiters[status] = {
      resolver, promise,
    }
  }
}