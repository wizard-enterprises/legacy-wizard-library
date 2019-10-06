import { TestSuite } from "./base-test-class"
import { GlobalSuite } from "../suite/global"
import { TestEntityRegistery } from "../core/test-registery"
import { TestEntityIdStore } from "../core/abstract-test-entity"

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

export interface DecoratorOpts {
  name?: string,
  only?: true,
  skip?: true,
}
export interface SuiteDecoratorOpts extends DecoratorOpts {}
export interface TestDecoratorOpts extends DecoratorOpts {}

let defaultConfig = DecoratorConfig.getInstance()

export function Suite(opts: SuiteDecoratorOpts = {}) {
  return decorateSuite(defaultConfig, opts)
}

export function decorateSuite(config, opts: SuiteDecoratorOpts = {}) {
  return decorateSubSuite(config, null, opts)
}

export function SubSuite(parentSuite: new () => TestSuite, opts: SuiteDecoratorOpts = {}) {
  return decorateSubSuite(defaultConfig, parentSuite, opts)
}

export function decorateSubSuite(config, parentSuite: new () => TestSuite, opts: SuiteDecoratorOpts = {}) {
  return function (target: new () => TestSuite) {
    if (doesClassExtend(target, TestSuite) === false)
      throw new Error(`Invalid class registered as suite. Class "${target.name}" must extend TestSuite.`)
    config.registery.registerSuite(target, opts, parentSuite)
  }
}

function doesClassExtend(ctor1, ctor2) {
  return ctor1 === ctor2 || ctor1.prototype instanceof ctor2
}

export function Test(opts: TestDecoratorOpts = {}) {
  return decorateTest(defaultConfig, opts)
}

export function decorateTest(config, opts: TestDecoratorOpts = {}) {
  return function (suite: TestSuite, testName: string) {
    config.registery.registerTest(suite, suite[testName], testName, {...opts, name: opts.name || testName})
  }
}