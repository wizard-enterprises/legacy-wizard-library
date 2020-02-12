import { ClassInstanceDecorator, InstanceDecorator } from 'wizard-decorators' ///lib/abstract'
import { Strategy } from './strategy/abstract'
import { ArgsBuilderStrategy } from './strategy/args-builder'
import { FlatStrategy } from './strategy/flat'

export function makeComposableFunction<F extends Function = Function>(strategy: Strategy, func: F): F
export function makeComposableFunction<F extends Function = Function>(strategyType: keyof typeof Strategies, func: F): F
export function makeComposableFunction<F extends Function = Function>(strategyType: keyof typeof Strategies, strategyOpts: any[], func: F): F
export function makeComposableFunction<F extends Function = Function>(...args) {
  let [strategy, func] = parseMakeComposableFunctionArgs<F>(...args)
  return strategy.composeOn(func)
}

function parseMakeComposableFunctionArgs<F>(...args) {
  let strategyOrType = args[0],
    strategyOpts = args[1] instanceof Array
      ? args[1]
      : null,
    func = strategyOpts ? args[2] : args[1],
    strategy = typeof strategyOrType === 'string'
      ? makeStrategyOfType(strategyOrType as keyof typeof Strategies, ...(strategyOpts || []))
      : strategyOrType as Strategy
  return [strategy, func]
}

export enum Strategies {
  flat = 'flat',
  argsBuilder = 'argsBuilder',
}

function makeStrategyOfType(type: keyof typeof Strategies, ...opts: any[]) {
  switch (type) {
    case Strategies.argsBuilder:
      //@ts-ignore
      return new ArgsBuilderStrategy(...opts)
    case Strategies.flat:
      return new FlatStrategy(...opts)
    default:
      return new Strategy()
  }
}

class ComposeDecorator extends ClassInstanceDecorator {
  instanceDecoratorClass = ComposeInstanceDecorator

  constructor() {
    super({
      compose: {},
    })
  }
}

class ComposeInstanceDecorator extends InstanceDecorator {
  static withArgs = true

  decorateOnInstance(instance, name) {
    return this.composeFuncFromArgs(super.decorateOnInstance(instance, name))
  }
  
  private composeFuncFromArgs(func) {
    //@ts-ignore
    return makeComposableFunction(this.args[0], this.args.slice(1), func)
  }
}

//@ts-ignore
export const compose = (new ComposeDecorator).getDecorators()