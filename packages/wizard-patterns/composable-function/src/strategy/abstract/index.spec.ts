import { Suite, TestSuite, SubSuite, Test } from 'polymorphic-tests'
import { makeComposableFunction, Strategies } from '../..'

@Suite() export class ComposableFunction extends TestSuite {}
export abstract class ComposableFunctionSuite extends TestSuite {
  abstract strategy: Strategies
  protected composeArgs: any[]//[Function, ...any[]]
  protected funcCallArgs: any[] = []
  
  protected composeAndCall(funcCallArgs = this.funcCallArgs, composeArgs = this.composeArgs,) {
    return this.compose(...composeArgs)(...funcCallArgs)
  }

  protected compose(...args) {
    //@ts-ignore
    return makeComposableFunction(this.strategy, ...args)
  } 
}
