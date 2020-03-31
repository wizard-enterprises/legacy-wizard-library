import { ClassInstanceDecorator, InstanceDecorator, CachedReturn } from 'wizard-decorators'
import { makeComposableFunction, Strategies } from 'wizard-composable-function'
import { Machine, MachineConfig, State, StateMachine as _StateMachine, Event as _Event, StateSchema, EventObject, interpret, Interpreter, assign, send, sendParent, forwardTo, Assigner, PropertyAssigner, SendExpr, SendActionOptions, ExprWithMeta, LogExpr, StateNode } from 'xstate'
import { getPrototypical } from 'wizard-utils'
import { raise, respond, escalate, log } from 'xstate/lib/actions'
import { isObservable } from 'xstate/lib/utils'
import { Observable } from 'rxjs'
import merge from 'lodash/merge'

let IMPLEMENTATIONS = Symbol('decorated implementations')
enum ActionType {
  assign = 'assign',
  send = 'send',
  sendParent = 'sendParent',
  raise = 'raise',
  respond = 'respond',
  forwardTo = 'forwardTo',
  escalate = 'escalate',
  log = 'log',
}

export type InvokableType<T = any> =
  | T
  | Promise<T>
  | Observable<T>
  | Function
  | StateMachine
  | StateNode

class StateMachineClassDecorator extends ClassInstanceDecorator {
  protected instanceDecoratorClass = StateMachineInstanceDecorator
  constructor() {
    super({
      Action: 'actions',
      Guard: 'guards',
      Invokable: 'services',
      Activity: 'activities',
      Delay: 'delays',
    })
  }


  decorateNewInstance(instance) {
    super.decorateNewInstance(instance)
    instance[IMPLEMENTATIONS] = merge({}, ...getPrototypical(instance, IMPLEMENTATIONS))
  }

  getInstanceDelegate() {
    let self = this
    return {
      ...super.getInstanceDelegate(),
      registerImplementation(proto, type, name, detail: any) {
        //@ts-ignore
        let typeName = self.instanceDecorators[type]
        if (proto[IMPLEMENTATIONS] === undefined)
          proto[IMPLEMENTATIONS] = {}
        if (proto[IMPLEMENTATIONS][typeName] === undefined)
          proto[IMPLEMENTATIONS][typeName] = {}//new Map
        let toRegister = detail === undefined ? name : {name, detail}
        proto[IMPLEMENTATIONS][typeName][name] = toRegister
      },
    }
  }
}

class StateMachineInstanceDecorator extends InstanceDecorator {
  static withArgs = true

  decorateByType(type, ...args) {
    //@ts-ignore
    let thisArgs = this.args,
      detail
    if (thisArgs[0] !== undefined)
      detail = {
        type: thisArgs[0],
        args: thisArgs.slice(1),
      }
    //@ts-ignore
    this.delegate.registerImplementation(args[0], this.name, args[1], detail)
    return super.decorateByType(type, ...args)
  }
}

//@ts-ignore
let decorators = new StateMachineClassDecorator().getDecorators()
export const machine = decorators.klass
export const Action = makeComposableFunction(
  Strategies.argsBuilder,
  [Object.keys(ActionType).reduce((acc, type) => ({
    //@ts-ignore
    ...acc,
    [type]: ((...args) => [type, ...args]),
  }), {} as any)],
  (...args) => decorators.Action(...args),
)
export const Guard = decorators.Guard
export const Invokable = decorators.Invokable
export const Activity = decorators.Activity
export const Delay = decorators.Delay

@machine export abstract class StateMachine<TContext extends Object = any, TStateSchema extends StateSchema = any, TEvent extends EventObject = any> {
  id: string
  abstract def: MachineConfig<TContext, TStateSchema, TEvent>
  protected initialContext: TContext

  constructor(id?: string) {
    if (id) this.id = id
  }
  
  public get state(): State<TContext, TEvent, TStateSchema> { return this.instance.state }
  
  @CachedReturn protected get pureMachine(): _StateMachine<TContext, TStateSchema, TEvent> {
    return this.getNewMachineInstance()
  }

  protected getNewMachineInstance() {
    return Machine<TContext, TStateSchema, TEvent>(this.makeDef(), this.makeImplementations())
  }

  public instance: Interpreter<TContext, TStateSchema, TEvent>
  public start(ctx?: Partial<TContext>) {
    if (this.instance) this.stop()
    let machine = this.pureMachine
    if (ctx)
      machine = machine.withContext(
        {...this.initialContext, ...ctx} as TContext)
    this.instance = this.interpretMachine(machine)
      .start()
    return this
  }

  protected interpretMachine(machine: _StateMachine<TContext, TStateSchema, TEvent>) {
    return interpret<TContext, TStateSchema, TEvent>(machine)
  }

  public stop() {
    this.instance.stop()
  }

  protected makeDef() {
    let o: any = {}
    if (this.id) o.id = this.id
    if (this.initialContext) o.context = this.initialContext 
    return {
      ...o,
      ...this.def,
    }
  }

  private makeImplementations() {
    let self = this,
      implementations: {[key: string]: {[key: string]: any}} = this[IMPLEMENTATIONS] ?? {}
    return Object.entries(implementations)
      .reduce((acc, [type, typedImplementations]) => ({
        ...acc,
        [type]: self.getTypedImplementations(type, typedImplementations),
      }), {})
  }

  protected getTypedImplementations(type, implementations: {[key: string]: any}) {
    return Object.entries(implementations).reduce((acc, [name, implementation]) => {
      let detail
      if (implementation !== `${implementation}`) {
        detail = implementation.detail
        implementation = implementation.name
      }
      acc[name] = this.getImplementation(type, implementation, detail)
      return acc
  }, {})
  }

  protected getImplementation(type, name, detail) {
    let self = this
    let implementation = this[name] instanceof Function
      ? new Proxy(this[name], {
        apply(target, thisArg, args) {
          let implementation = Reflect.apply(target, self, args)
          return self.wrapImplementation(type, implementation)
        }
      })
      : self.wrapImplementation(type, this[name])
    
    return detail === undefined
      ? implementation
      : this.applyDetailToImplementation(implementation, type, name, detail)
  }

  protected wrapImplementation(type, implementation) {
    if (type === 'services') {
      if (this.isInvokable(implementation) === false)
        return Promise.resolve(implementation)
      else if (implementation instanceof StateMachine)
        return implementation.pureMachine
    }
    return implementation
  }

  protected isInvokable(invokable) {
    return invokable instanceof Function
      || invokable instanceof Promise
      || isObservable(invokable)
      || invokable instanceof StateMachine
      || invokable instanceof StateNode
  }

  private applyDetailToImplementation(implementation, type, name, detail) {
    if ((type === 'actions' && detail.type in ActionType) === false)
      return implementation
    return this.applyActionTypeToImplementation(implementation, detail)
  }

  private applyActionTypeToImplementation<TErrorData = any>(implementation, detail) {
    switch (detail.type) {
      case ActionType.assign: return this.assign(implementation)
      case ActionType.send: return this.send(implementation, ...detail.args)
      case ActionType.sendParent: return this.sendParent(implementation, ...detail.args)
      case ActionType.raise: return this.raise(implementation)
      case ActionType.respond: return this.respond(implementation, ...detail.args)
      case ActionType.forwardTo: return this.forwardTo(implementation, ...detail.args)
      case ActionType.escalate: return this.escalate<TErrorData>(implementation, ...detail.args)
      case ActionType.log: return this.log(implementation, ...detail.args)
    }
  }

  protected assign(assignment: Assigner<TContext, TEvent> | PropertyAssigner<TContext, TEvent>) {
    return assign<TContext, TEvent>(assignment)
  }

  protected send(event: _Event<TEvent> | SendExpr<TContext, TEvent>, options?: SendActionOptions<TContext, TEvent>) {
    return send<TContext, TEvent>(event, options)
  }

  protected sendParent(event: _Event<TEvent> | SendExpr<TContext, TEvent>, options?: SendActionOptions<TContext, TEvent>) {
    return sendParent<TContext, TEvent>(event, options)
  }

  protected raise(event: _Event<TEvent>) {
    return raise<TContext, TEvent>(event)
  }

  protected respond(event: _Event<TEvent> | SendExpr<TContext, TEvent>, options?: SendActionOptions<TContext, TEvent>) {
    return respond<TContext, TEvent>(event, options)
  }

  protected forwardTo(target: Required<SendActionOptions<TContext, TEvent>>['to'], options?: SendActionOptions<TContext, TEvent>) {
    return forwardTo<TContext, TEvent>(target, options)
  }

  protected escalate<TErrorData = any>(errorData: TErrorData | ExprWithMeta<TContext, TEvent, TErrorData>, options?: SendActionOptions<TContext, TEvent>) {
    return escalate<TContext, TEvent, TErrorData>(errorData, options)
  }

  protected log(expr?: string | LogExpr<TContext, TEvent>, label?: string) {
    return log<TContext, TEvent>(expr, label)
  }
}
