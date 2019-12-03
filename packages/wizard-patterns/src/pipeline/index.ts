export enum PipeStatus {
  clean = -1,
  piping = 0,
  piped = 1,
}

export abstract class Pipe<inputT = any, outputT = inputT, initArgsT extends any = any> {
  public dryRun: boolean = false
  public waitForAsync: boolean = true
  public didRun: boolean = false
  public input: inputT = null
  public output: outputT = null
  public initArgs: initArgsT = null
  
  constructor(args?: initArgsT, opts: {waitForAsync?: boolean} = {}) {
    this.initArgs = args
    if (opts.waitForAsync !== undefined)
    this.waitForAsync = opts.waitForAsync
  }

  protected readonly initialStatus: PipeStatus = PipeStatus.clean
  private statusWaiters = new PipeStatusWaiters(this.initialStatus)
  private _status: PipeStatus = this.initialStatus
  public get status() {
    return this._status
  }

  public set status(status) {
    this._status = status
    this.statusWaiters.setStatus(status)
  }

  public waitForStatus(status: PipeStatus) {
    return this.statusWaiters.waitFor(status)
  }
  
  public run(input?: inputT): outputT | Promise<outputT> {
    this.input = input
    this.status = PipeStatus.piping
    let piped = this.pipe(input)
    return this.shouldWaitFor(piped)
      ? (piped as Promise<outputT>).then(output => this.endRun(output))
      : this.endRun(piped as outputT)
  }

  protected shouldWaitFor(thing: Promise<any> | any) {
    return thing instanceof Promise && this.waitForAsync
  }

  private endRun(output: outputT) {
    this.output = output
    this.status = PipeStatus.piped
    this.didRun = true
    return output
  }

  abstract pipe(value: inputT): Promise<outputT> | outputT
}

class PipeStatusWaiters {
  private waiters = {}
  constructor (private currentStatus = PipeStatus.clean) {}

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
      resolver, promise
    }
  }
}