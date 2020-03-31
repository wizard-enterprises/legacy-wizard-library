import { BehaviorSubject, Observable } from 'rxjs'
import { distinct, filter, take, tap } from 'rxjs/operators'
import { Action, Guard, Invokable, InvokableType, StateMachine } from 'wizard-state-machine'

const UNSET: unique symbol = Symbol('UNSET')

export enum PipeStatus {
  'clean' = 'clean',
  'piping' = 'piping',
  'leaked' = 'leaked',
  'piped' = 'piped',
}

type PipeMachineContext<TInput = any, TOutput = TInput> = {
  input?: TInput,
  output?: TOutput,
  initialInput: (typeof UNSET) | TInput,
  leakedError?: Error,
}

type PipeMachineStateSchema = {
  states: {
    [PipeStatus.clean]: {},
    [PipeStatus.piping]: {},
    [PipeStatus.leaked]: {},
    [PipeStatus.piped]: {},
  },
}

type PipeMachineEvent<TInput = any, TOutput = TInput> =
  | {type: 'PIPE', data: TInput}
  | {type: 'LEAK', error: Error}
  | {type: 'PIPED', data: TOutput}

interface PipeMachineDelegate<TInput = any, TOutput = TInput> {
  pipe(input: TInput): InvokableType<TOutput>
  leaked(error: Error): void
  setStatus(status: PipeStatus): void
}

class PipeMachine<TInput = any, TOutput = TInput> extends StateMachine<PipeMachineContext<TInput, TOutput>, PipeMachineStateSchema, PipeMachineEvent<TInput, TOutput>> {
  constructor(protected delegate: PipeMachineDelegate) { super() }

  public input?: TInput
  public output?: TOutput

  initialContext = {
    input: null,
    output: null,
    initialInput: UNSET as typeof UNSET,
  }
  def = {
    initial: PipeStatus.clean,
    states: {
      [PipeStatus.clean]: {
        on: {
          '': {
            cond: 'initialInputWasProvided',
            actions: ctx =>
              this.raise({type: 'PIPE', data: ctx.initialInput}),
          },
          PIPE: {
            target: 'piping',
            actions: 'assignInput',
          },
        },
      },
      [PipeStatus.piping]: {
        invoke: {
          id: 'piping',
          src: 'makeOutput',
          onDone: {
            target: 'piped',
            actions: 'assignOutput',
          },
          onError: {
            target: 'leaked',
            actions: 'leakError',
          },
        },
      },
      [PipeStatus.leaked]: {
        type: 'final' as 'final',
        data: ctx => ctx.leakedError,
      },
      [PipeStatus.piped]: {
        type: 'final' as 'final',
        data: ctx => ctx.output,
      },
    }
  }

  protected interpretMachine(machine) {
    return super.interpretMachine(machine)
      .onTransition(state => {
        let status = state.value === `${state.value}`
          ? state.value
          : Object.entries(state.value).map(pair => pair.join('.'))[0]
        this.delegate.setStatus(status as PipeStatus)
      })
  }

  @Guard() initialInputWasProvided(ctx) {
    return ctx.initialInput !== UNSET
  }

  //@ts-ignore
  @Action.assign() assignInput = {
    input: (ctx, ev) => ev.data,
  }

  //@ts-ignore
  @Action.assign() assignOutput = {
    output: (ctx, ev) => ev.data,
  }

  //@ts-ignore
  @Action.assign() leakError = {
    leakedError: (ctx, ev) =>
      [ev.error, ev.data]
        .find(e => e instanceof Error) ?? new Error(ev.data.message),
  }

  @Invokable() makeOutput(ctx, ev): InvokableType<TOutput> {
    return this.delegate.pipe(ctx.input)
  }

  public pipeIn(input: TInput) {
    this.instance.send({type: 'PIPE', data: input})
  }
}

abstract class BasePipe<TInput = any, TOutput = TInput> {
  public name?: string
  
  machine: PipeMachine<TInput, TOutput>
  public init() {
    //@ts-ignore
    this.machine = new PipeMachine<TInput, TOutput>(this.getMachineDelegate()).decorateInstance()
    return this
  }

  protected statusSubject: BehaviorSubject<PipeStatus> = new BehaviorSubject<PipeStatus>(PipeStatus.clean)
  public status: Observable<PipeStatus> = this.statusSubject.pipe(
    distinct(),
  )

  public get input(): TInput { return this.machine.state.context.input }
  public get output(): TOutput { return this.machine.state.context.output }

  protected getMachineDelegate(): PipeMachineDelegate<TInput, TOutput> {
    return {
      pipe: (input: TInput): InvokableType<TOutput> => this.pipe(input),
      leaked: (error: Error) => this.leaked(error),
      setStatus: (status: PipeStatus) => this.statusSubject.next(status)
    }
  }

  public waitForStatus(...stati: PipeStatus[]) {
    if (stati.includes(PipeStatus.leaked) === false)
      stati.push(PipeStatus.leaked)
    return this.status.pipe(
      filter(status => stati.includes(status)),
      take(1),
      tap(status => {
        if (status === PipeStatus.leaked) {
          let e = this.machine.instance.state.context.leakedError
          throw e
        }
      })
    ).toPromise()
  }

  public async run(input?: TInput) {
    if (!this.machine.instance || this.machine.instance.state.done)
      this.machine.start()
    this.machine.pipeIn(input)
    await this.waitForStatus(PipeStatus.piped)
    return this.machine.instance.state.context.output
  }
  protected pipe(input: TInput): InvokableType<TOutput> {
    return this.makeOutput(input)
  }
  protected leaked(error: Error) {}
  protected abstract makeOutput(input: TInput): InvokableType<TOutput>
}

export abstract class Pipe<TInput = any, TOutput = TInput> extends BasePipe<TInput, TOutput> {}
