import { TestSuite } from "./base-test-class"
import { GlobalSuite } from "../suite/global"
import { TestEntityRegistery } from "../core/test-registery"

export class DecoratorConfig {
  private static instance: DecoratorConfig = null
  static getInstance() {
    return this.instance || (this.instance = new DecoratorConfig)
  }
  
  public registery: TestEntityRegistery
  
  protected constructor(rootSuite = GlobalSuite.getInstance()) {
    this.registery = new TestEntityRegistery(rootSuite)
  }
}

export interface DecoratorOpts {
  name?: string,
  only?: true,
  skip?: true,
}
export interface SuiteDecoratorOpts extends DecoratorOpts {}
export interface TestDecoratorOpts extends DecoratorOpts {}

export function Suite(opts: SuiteDecoratorOpts = {}) {
  return decorateSuite(opts)
}

export function decorateSuite(opts: SuiteDecoratorOpts, config = DecoratorConfig.getInstance()) {
  return decorateSubSuite(null, opts as SuiteDecoratorOpts, config)
}

export function SubSuite(parentSuite: new () => TestSuite, opts: SuiteDecoratorOpts) {
  return decorateSubSuite(parentSuite, opts)
}

export function decorateSubSuite(parentSuite: new () => TestSuite, opts: SuiteDecoratorOpts, config = DecoratorConfig.getInstance()) {
  return function (target: new () => TestSuite) {
    config.registery.registerSuite(target, opts, parentSuite)
  }
}

export function Test(opts: TestDecoratorOpts = {}) {
  return decorateTest(opts)
}

export function decorateTest(opts: TestDecoratorOpts, config = DecoratorConfig.getInstance()) {
  return function (suite: TestSuite, testName: string) {
    config.registery.registerTest(suite, suite[testName], testName, {...opts, name: opts.name || testName})
  }
}