import { TestSuite } from '../public-api'
import { SuiteDecoratorOpts, TestDecoratorOpts } from '../public-api/decorators'
import { GlobalSuite } from '../suite/global'
import { PolymorphicSuite } from '../suite/polymorphic'
import { PolymorphicTestMethod } from '../test-method/polymorphic'
import { TestEntityIdStore } from './abstract-test-entity'
import { getPrototypical } from 'wizard-utils'

export class TestEntityRegistery {
  private suites: TestSuite[] = []
  private suiteRegistery: WeakMap<
    TestSuite,
    PolymorphicSuite
  > = new WeakMap
  private testsBySuiteCtor: WeakMap<
    new () => TestSuite,
    {opts: TestDecoratorOpts, externalTest: Function}[]
  > = new WeakMap

  constructor(public rootSuite: GlobalSuite, private idStore: TestEntityIdStore) {}

  public registerTest(externalSuite: TestSuite, externalTest: Function, externalTestName: string, opts: TestDecoratorOpts) {
    opts.name = opts.name || externalTestName
    let test = {opts, externalTest},
      suiteCotr = externalSuite.constructor as new () => TestSuite
    this.testsBySuiteCtor.get(suiteCotr)
      ? this.testsBySuiteCtor.get(suiteCotr).push(test)
      : this.testsBySuiteCtor.set(suiteCotr, [test])
  }

  public registerSuite(externalSuite: new () => TestSuite, opts: SuiteDecoratorOpts = {}, externalParentSuite: new () => TestSuite): PolymorphicSuite {
    let name = opts.name || externalSuite.name,
      externalSuiteInstance = new externalSuite,
      internal = new PolymorphicSuite(name, {skip: opts.skip, only: opts.only}, externalSuiteInstance, this.idStore)
    //@ts-ignore
    if (externalSuite.onDecorate && (externalSuite.onDecorate !== TestSuite.onDecorate))
      //@ts-ignore
      externalSuite.onDecorate()
    this.registerSuiteInParent(internal, externalParentSuite)
    this.addPrototypicalTestsToSuite(internal, externalSuiteInstance)
    this.suites.push(externalSuiteInstance)
    this.suiteRegistery.set(externalSuiteInstance, internal)
    return internal
  }

  private registerSuiteInParent(suite: PolymorphicSuite, externalParent: new () => TestSuite) {
    let parentSuite = this.getRegisteredSuite(externalParent) || this.rootSuite
    parentSuite.addSubTestEntities(suite)
  }

  private getRegisteredSuite(externalEntity: new () => TestSuite): PolymorphicSuite {
    let instance = this.suites.find(suite => suite.constructor === externalEntity)
    return this.suiteRegistery.get(instance)
  }

  private addPrototypicalTestsToSuite(suite: PolymorphicSuite, externalSuite: TestSuite) {
    suite.addSubTestEntities(...this.getConstructorsFromBaseTestClassToSuite(externalSuite)
      .map(ctor => this.testsBySuiteCtor.get(ctor) || [])
      .reduce((acc, arr) => acc = [...arr, ...acc], [])
      .map(({externalTest, opts}) => {
        let test = new PolymorphicTestMethod(opts.name, externalTest, opts, this.idStore)
        test.testSuite = externalSuite
        return test
      }))
  }

  private getConstructorsFromBaseTestClassToSuite(suite: TestSuite) {
    return getPrototypical<TestSuite, new () => TestSuite>(suite, 'constructor', TestSuite)
  }
}