import { makeComposableFunction, Strategies } from 'wizard-composable-function'
import { TestEntityIdStore } from '../core/abstract-test-entity'
import { TestEntityRegistery } from '../core/test-registery'
import { GlobalSuite } from '../suite/global'
import { TestSuite } from './suites'

export class DecoratorConfig {
  private static instance: DecoratorConfig = null
  static getInstance() {
    return this.instance || (this.instance = new DecoratorConfig)
  }
  
  public registery: TestEntityRegistery
  public idStore: TestEntityIdStore
  
  protected constructor(rootSuite = GlobalSuite.getInstance(), idStore = TestEntityIdStore.getInstance()) {
    this.registery = new TestEntityRegistery(rootSuite, idStore)
  }
}

let composeDecorator = func => makeComposableFunction(
  Strategies.argsBuilder,
  [{
    skip: (args = {}) => [{skip: true, ...args}],
    only: (args = {}) => [{only: true, ...args}],
  }],
  func,
)

export interface DecoratorOpts {
  name?: string,
  only?: true,
  skip?: true,
}
export interface SuiteDecoratorOpts extends DecoratorOpts {}
export interface TestDecoratorOpts extends DecoratorOpts {}

let defaultConfig = DecoratorConfig.getInstance()

export const Suite = composeDecorator(function Suite(opts: SuiteDecoratorOpts = {}) {
  return decorateSuite(defaultConfig, opts)
})

export function decorateSuite(config: DecoratorConfig, opts: SuiteDecoratorOpts = {}) {
  return decorateSubSuite(config, null, opts)
}

export const SubSuite = composeDecorator(function SubSuite(parentSuite: new () => TestSuite, opts: SuiteDecoratorOpts = {}) {
  return decorateSubSuite(defaultConfig, parentSuite, opts)
})

export function decorateSubSuite(config: DecoratorConfig, parentSuite: new () => TestSuite, opts: SuiteDecoratorOpts = {}) {
  return function (target: new () => TestSuite) {
    if (doesClassExtend(target, TestSuite) === false)
      throw new Error(`Invalid class registered as suite. Class "${target.name}" must extend TestSuite.`)
    config.registery.registerSuite(target, opts, parentSuite)
  }
}

function doesClassExtend(ctor1, ctor2) {
  return ctor1 === ctor2 || ctor1.prototype instanceof ctor2
}

export const Test = composeDecorator(function Test(opts: TestDecoratorOpts = {}) {
  return decorateTest(defaultConfig, opts)
})

export function decorateTest(config, opts: TestDecoratorOpts = {}) {
  return function (suite: TestSuite, testName: string) {
    config.registery.registerTest(suite, suite[testName], testName, {...opts, name: opts.name || testName})
  }
}

// @compose.klass class TestFrameworkDecorator extends ClassInstanceDecorator {
//   static withArgs = true

//   @compose.compose(...decoratorOptsComposition) decorate(...args) {
//     let composed = super.decorate(...args),
//       self = this
//     return (...decoratorArgs) => {
//       self.decorateTestEntity(...self.args)
//       return composed(...decoratorArgs)
//     }
//   }

//   decorateTestEntity(...args) {}
// }


