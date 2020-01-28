import { FlatStrategy } from './strategy/flat'
import { Strategy } from './strategy/abstract'
import { ArgsBuilderStrategy } from './strategy/args-builder'

export function makeComposableFunction<F extends Function = Function>(strategyType: keyof typeof Strategies, func: F): F
export function makeComposableFunction<F extends Function = Function>(strategyType: keyof typeof Strategies, strategyOpts: any[], func: F): F
export function makeComposableFunction<F extends Function = Function>(strategyType: keyof typeof Strategies, ...args) {
  let [func, strategyOpts] = parseMakeComposableFunctionArgs<F>(...args)
  let strategy = makeStrategyOfType(strategyType, ...strategyOpts)
  if (func === null)
    //@ts-ignore
    func = () => {throw new Error(strategy.getIllegalBaseFunctionCallErrorMessage())}
  strategy.composeOn(func)
  return func
}

function parseMakeComposableFunctionArgs<F>(...args) {
  let [strategyOpts, func] = args
  return strategyOpts instanceof Array
    ? [func, strategyOpts]
    : [strategyOpts as unknown as F, []]
}

export enum Strategies {
  flat = 'flat',
  argsBuilder = 'argsBuilder',
}

function makeStrategyOfType(type: keyof typeof Strategies, ...opts: any[]) {
  switch (type) {
    case Strategies.argsBuilder:
      return new ArgsBuilderStrategy(...opts)
    case Strategies.flat:
      return new FlatStrategy(...opts)
    default:
      return new Strategy()
  }
}
