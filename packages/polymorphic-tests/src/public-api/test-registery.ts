import { PolymorphicSuite } from "../suite/polymorphic"
import { PolymorphicTestMethod } from "../test-method/polymorphic"
import { TestSuite } from "./base-test-class"
import { TestDecoratorOpts, SuiteDecoratorOpts } from "./decorators"
import { GlobalSuite } from "../suite/global"

export class TestEntityRegistery {
  private suites: TestSuite[] = []
  private suiteRegistery: WeakMap<
    TestSuite,
    PolymorphicSuite
  > = new WeakMap
  private temporarySuitelessTests: WeakMap<
    new () => TestSuite,
    {opts: TestDecoratorOpts, externalTest: Function}[]
  > = new WeakMap

  constructor(public rootSuite: GlobalSuite) {}

  public registerSuite(externalSuite: new () => TestSuite, opts: SuiteDecoratorOpts = {}, externalParentSuite: new () => TestSuite): PolymorphicSuite {
    let name = opts.name || externalSuite.name,
      externalSuiteInstance = new externalSuite,
      internal = new PolymorphicSuite(name, {skip: opts.skip, only: opts.only}, externalSuiteInstance),
      parentSuite = externalParentSuite ? this.getRegisteredSuite(externalParentSuite) : this.rootSuite
    parentSuite.addSubTestEntities(internal)
    let tests = (this.temporarySuitelessTests.get(externalSuite) || [])
      .map(({externalTest, opts}) => new PolymorphicTestMethod(opts.name, externalTest, opts, externalSuiteInstance))
    internal.addSubTestEntities(...tests)
    this.temporarySuitelessTests.delete(externalSuite)
    this.suites.push(externalSuiteInstance)
    this.suiteRegistery.set(externalSuiteInstance, internal)
    return internal
  }

  private getRegisteredSuite(externalEntity: new () => TestSuite): PolymorphicSuite {
    let instance = this.suites.find(suite => suite.constructor === externalEntity)
    return this.suiteRegistery.get(instance)
  }

  public registerTest(externalSuite: TestSuite, externalTest: Function, externalTestName: string, opts: TestDecoratorOpts) {
    opts.name = opts.name || externalTestName
    let internal = {opts, externalTest},
      suiteCotr = externalSuite.constructor as new () => TestSuite
    this.temporarySuitelessTests.get(suiteCotr)
      ? this.temporarySuitelessTests.get(suiteCotr).push(internal)
      : this.temporarySuitelessTests.set(suiteCotr, [internal])
  }
}