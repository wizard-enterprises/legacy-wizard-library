import {ConsoleSpy, Console} from './console.mock'

class TestRunner {
  constructor(public rootSuite: Suite, public reporter: TestReporter) {}

  async run() {
    await this.reporter.start()
    await this.runRootSuite()
    await this.reporter.end()
  }
  
  protected async runRootSuite() {
    await this.rootSuite.run(this.reporter.getDelegate())
  }
}

enum TestEntityStatus {
  pending,
  executing,
  passed,
  failed,
  skipped,
}

enum TestEntityType {
  suite = 'suite',
  test = 'test',
}

abstract class TestEntity {
  public abstract type: TestEntityType
  get id(): string {
    return [
      this.type,
      ...(this.parentSuite
        ? [
          `_${this.parentSuite.id}_`,
          this.parentSuite.subTestEntities.findIndex(sub => sub === this),
        ]
        : [null]),
      this.name,
      ].filter(Boolean).join('_') 
  }
  public parentSuite: Suite = null
  private _status: TestEntityStatus = TestEntityStatus.pending
  public get status() { return this._status}

  private _shouldSkipBecauseOfOnly = false
  protected get shouldSkipBecauseOfOnly() { return this._shouldSkipBecauseOfOnly }
  protected set shouldSkipBecauseOfOnly(shouldSkipBecauseOfOnly) {
    this._shouldSkipBecauseOfOnly = shouldSkipBecauseOfOnly
    this.updateForSkipBecauseOfOnly()
  }

  protected updateForSkipBecauseOfOnly() {}

  constructor(public name: string, public opts: SuiteOpts | TestMethodOpts) {
    this.name = name
    this.opts = opts
    if (!this.opts['rootSuite'])
      this.parentSuite = GlobalSuite.getInstance()
  }

  public async run(reporter: TestReporterDelegate) {
    this.shouldSkipBecauseOfOnly = this.doesEntityHaveSubentitiesWithOnly(this) || !!this.opts.skipBecauseOfOnly
    if (this.shouldSkipEntity(this)) {
      reporter.testEntitySkipped(this)
      if (this.type === TestEntityType.suite) await this.runTestEntity(reporter)
      return
    }
    reporter.testEntityIsExecuting(this)
    try {
      await this.runTestEntity(reporter)
      reporter.testEntityPassed(this)
    } catch (e) {
      let reasons = this.failureReasonsOverride.length ? this.failureReasonsOverride : [e]
      reporter.testEntityFailed(this, ...reasons)
    }
  }

  private doesEntityHaveSubentitiesWithOnly(entity: TestEntity) {
    if (entity.type === TestEntityType.test) return false
    let e: Suite = entity as Suite
    return !!(e.subTestEntities.find(entity => entity.opts.only))
  }

  private shouldSkipEntity(entity: TestEntity) {
    return entity.opts.skip || entity.opts.skipBecauseOfOnly
  }

  protected failureReasonsOverride: Error[] = []

  protected abstract runTestEntity(reporter: TestReporterDelegate)

  public setStatus(status: TestEntityStatus) {
    this._status = status
  }
}

interface TestEntityOpts {
  skip?: true,
  skipBecauseOfOnly?: boolean,
  only?: true,
}

interface SuiteOpts extends TestEntityOpts {
  rootSuite?: true
}
interface TestMethodOpts extends TestEntityOpts {}

class Suite extends TestEntity {
  public type = TestEntityType.suite
  public subTestEntities: TestEntity[] = []
  private _opts: SuiteOpts
  public get opts(): SuiteOpts { return this._opts }
  public set opts(opts: SuiteOpts) {
    this._opts = opts
    if (this.subTestEntities)
      this.applyOptsToSubEntities(this.subTestEntities)
  }
  protected updateForSkipBecauseOfOnly() {
    this.applyOptsToSubEntities(this.subTestEntities)
  }
  constructor(name, opts: SuiteOpts = {}) {
    super(name, opts)
  }

  addSubTestEntities(...testEntities: TestEntity[]) {
    this.subTestEntities = this.subTestEntities.concat(
      this.applyOptsToSubEntities(testEntities))
    return this
  }
  
  private applyOptsToSubEntities(entities: TestEntity[], opts: SuiteOpts = this.opts) {
    for (let entity of entities) {
      entity.parentSuite = this
      opts = {...opts}
      delete opts.rootSuite
      delete opts.only 
      let entityOpts = {
        ...entity.opts,
        skipBecauseOfOnly: this.shouldApplySkipBecauseOfOnlyToSubEntity(
          entity, {...entity.opts, ...opts},
        ),
      }
      entity.opts = entityOpts
    }
    return entities
  }

  private shouldApplySkipBecauseOfOnlyToSubEntity(entity, entityOpts) {
    return !entity.opts.only && entityOpts.skipBecauseOfOnly ||
      this.shouldSkipBecauseOfOnly && (!entityOpts.only || entityOpts.skip)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    for (let testEntity of this.subTestEntities)
      await testEntity.run(reporter)
  }
}

class GlobalSuite extends Suite {
  private static instance = null
  static getInstance(opts: SuiteOpts = {}) {
    return this.instance || (this.instance = new GlobalSuite(opts))
  }

  protected constructor(opts: SuiteOpts = {}) {
    super('global', {...opts, rootSuite: true})//, only: true})
  }
}

class GlobalSuiteForTests extends GlobalSuite {
  static getNewInstance(opts: SuiteOpts = {}) {
    return new GlobalSuite(opts)
  }
}

class PolymorphicSuite extends Suite {
  constructor(name: string, opts: SuiteOpts, private externalSuite: TestSuite) {
    super(name, opts)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.externalSuite.setup()
    await super.runTestEntity(reporter)
    await this.externalSuite.teardown()
  }
}

class TestMethod extends TestEntity {
  public type = TestEntityType.test
  opts: TestMethodOpts
  constructor(name: string, public boundMethod: Function, opts: TestMethodOpts = {}) {
    super(name, opts)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.boundMethod()
  }
}

class PolymorphicTestMethod extends TestMethod {
  constructor(
    name: string,
    boundMethod: Function,
    public opts: TestDecoratorOpts,
    private testSuite: TestSuite,
  ) {
    super(name, boundMethod, opts)
  }

  async run(reporter) {
    await super.run(reporter)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.testSuite.runTestPolymorphically(this.name)
  }
}

class AssertionError extends Error {
  constructor(...args) {
    super(...args)
    //@ts-ignore
    if (Error.captureStackTrace) Error.captureStackTrace(this, AssertionError)
  }
}

function assertIncludes(a: string | Array<any>, b, message?) {
  assert(a.includes(b), message || `Expected "${b}" to be included in "${a}"`)
}

function assertPrimitiveEqual(a, b, message?) {
  [a, b] = [a, b].map(x => JSON.stringify(x))
  assertIdentical(
    a, b,
    message || `Expected: ${a}\n To primitively equal to ${b}`
  )
}

function assertIdentical(a, b, message?) {
  assert(a === b, message || `Expected "${a}" to be identical to "${b}"`)
}

function assertNot(boolean, message?) {
  assert(!boolean, message || `Expected "${boolean}" to be falsey`)
}

function assert(boolean, message?) {
  if (!boolean) throw new AssertionError(message || `Expected "${boolean}" to be truthy`)
}

type TestReporterDelegate = {
  testEntityIsExecuting(entity: TestEntity): void
  testEntityPassed(entity: TestEntity): void
  testEntityFailed(entity: TestEntity, ...reasons: Error[]): void
  testEntitySkipped(entity: TestEntity): void
}

abstract class TestReporter {
  protected entityCache = new TestReporterEntityCache

  constructor(protected rootSuite: Suite) {}
  abstract async start()
  abstract async end()

  public getDelegate() { return this as unknown as TestReporterDelegate }
  
  protected testEntityIsExecuting(entity: TestEntity) {
    this.updateTestEntityStatus(entity, TestEntityStatus.executing)
  }

  protected testEntityPassed(entity: TestEntity) {
    this.updateTestEntityStatus(entity, TestEntityStatus.passed)
  }
  
  protected testEntityFailed(entity: TestEntity, ...reasons: Error[]) {
    this.updateTestEntityStatus(entity, TestEntityStatus.failed)
    this.entityCache.addFailureReasons(entity, ...reasons)
  }
  
  protected testEntitySkipped(entity: TestEntity) {
    this.updateTestEntityStatus(entity, TestEntityStatus.skipped)
  }
  
  private updateTestEntityStatus(entity: TestEntity, status: TestEntityStatus) {
    this.entityCache.syncTestEntityWithCache(entity).setStatus(status)
  }
  protected testEntityCache: Map<string, TestEntity> = new Map
  protected testEntityFailureReasons: Map<string, Error[]> = new Map
}

class TestReporterEntityCache {
  public entities: Map<string, TestEntity> = new Map
  public failureReasons: Map<string, Error[]> = new Map

  public get methods() {
    return this.getFilteredEntitiesByType(TestEntityType.test)
  }

  public get suites() {
    return this.getFilteredEntitiesByType(TestEntityType.suite)
  }

  private getFilteredEntitiesByType(type: TestEntityType) {
    return [...this.entities.values()].filter(entity => entity.type === type)
  }
  
  public syncTestEntityWithCache(entity: TestEntity) {
    if (this.shouldSaveEntityToCache(entity))
      this.entities.set(entity.id, entity)
    return entity
  }
  
  private shouldSaveEntityToCache(entity: TestEntity) {
    return !this.entities.get(entity.id) || (
      this.entities.get(entity.id) &&
      this.entities.get(entity.id) !== entity
    )
  }
  
  public addFailureReasons(entity: TestEntity, ...reasons: Error[]) {
    if (!this.failureReasons.get(entity.id))
      this.failureReasons.set(entity.id, reasons)
    else
      this.failureReasons.get(entity.id).concat(reasons)
  }
}

type ExternalTestEntity = (new () => TestSuite)|Function
class TestEntityRegistery {
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

  public registerSuite(externalSuite: new () => TestSuite, opts: SuiteDecoratorOpts | SubSuiteDecoratorOpts = {}): PolymorphicSuite {
    let name = opts.name || externalSuite.name,
      externalSuiteInstance = new externalSuite,
      internal = new PolymorphicSuite(name, {skip: opts.skip, only: opts.only}, externalSuiteInstance),
      parentSuite = opts['parentSuite'] ? this.getRegisteredSuite(opts['parentSuite']) as Suite : this.rootSuite
    if (!parentSuite) throw new Error('Sub suite registered before its parent')
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

interface TestSuiteRunnerDelegate {
  runTestPolymorphically(testName: string): Promise<void>,
}

class TestSuite implements TestSuiteRunnerDelegate {
  setup(): any|Promise<any> {}
  teardown(): any|Promise<any> {}
  before(): any|Promise<any> {}
  after(): any|Promise<any> {}

  public async runTestPolymorphically(testName: string) {
    let clone = this.cloneSelf()
    await clone.before()
    await clone[testName]()
    await clone.after()
  }

  private cloneSelf(obj = this) {
    if (obj === null || typeof obj !== 'object')
      return obj
    let props = Object.getOwnPropertyDescriptors(obj)
    for (let key in props)
      props[key].value = this.cloneSelf(props[key].value)
    return Object.create(
      Object.getPrototypeOf(obj), 
      props,
    )
  }
}

class DecoratorConfig {
  private static instance: DecoratorConfig = null
  static getInstance() {
    return this.instance || (this.instance = new DecoratorConfig)
  }
  
  public registery: TestEntityRegistery = new TestEntityRegistery(GlobalSuite.getInstance())
  
  protected constructor() {}
}

class DecoratorConfigForTests extends DecoratorConfig {
  static getNewInstance() {
    return new DecoratorConfig
  }
}

interface DecoratorOpts {
  name?: string,
  only?: true,
  skip?: true,
}
interface SuiteDecoratorOpts extends DecoratorOpts {}
interface SubSuiteDecoratorOpts extends SuiteDecoratorOpts {
  parentSuite: new () => TestSuite,
}
interface TestDecoratorOpts extends DecoratorOpts {}

function SuiteDecorator(opts: SuiteDecoratorOpts = {}) {
  return decorateSuite(opts)
}

function decorateSuite(opts: SuiteDecoratorOpts, config = DecoratorConfig.getInstance()) {
  return decorateSubSuite(null, opts as SuiteDecoratorOpts, config)
}

function SubSuite(parentSuite: new () => TestSuite, opts: SuiteDecoratorOpts) {
  return decorateSubSuite(parentSuite, opts)
}

function decorateSubSuite(parentSuite: new () => TestSuite, opts: SuiteDecoratorOpts, config = DecoratorConfig.getInstance()) {
  return function (target: new () => TestSuite) {
    config.registery.registerSuite(target, {...opts, parentSuite})
  }
}

function Test(opts: TestDecoratorOpts = {}) {
  return decorateTest(opts)
}

function decorateTest(opts: TestDecoratorOpts, config = DecoratorConfig.getInstance()) {
  return function (suite: TestSuite, testName: string) {
    config.registery.registerTest(suite, suite[testName], testName, {...opts, name: opts.name || testName})
  }
}

class SimpleTestReporter extends TestReporter {
  console
  constructor(rootSuite: Suite, _console: Console = console) {
    super(rootSuite)
    this.console = _console
  }

  async start() {
    this.console.log('Running tests...')
  }
  
  async end() {
    this.console.log(this.makeEndReport())
  }

  protected testEntityFailed(entity: TestEntity, ...reasons: Error[]) {
    super.testEntityFailed(entity, ...reasons)
    if (entity.type === TestEntityType.test)
      this.reportTestFailure(entity as TestMethod, ...reasons)
  }

  private reportTestFailure(entity: TestMethod, ...reasons: Error[]) {
    this.console.error(`Test "${entity.name}" failed:\n`, ...reasons)
  }

  makeEndReport() {
    let methods = this.entityCache.methods,
      passingMethods = methods.filter(test => test.status === TestEntityStatus.passed),
      failingMethods = methods.filter(test => test.status === TestEntityStatus.failed),
      passingTestsReport = `${passingMethods.length}/${methods.length} passed`

    return failingMethods.length
      ? `Run failed, ${failingMethods.length} failed, ${passingTestsReport}.`
      : `Run successful, ${passingTestsReport}.`
  }
}

@SuiteDecorator()
class SimpleFlows extends TestSuite {
  private globalSuite: GlobalSuite
  private decoratorConfig: DecoratorConfig
  private registery: TestEntityRegistery
  before() {
    this.globalSuite = GlobalSuiteForTests.getNewInstance()
    this.decoratorConfig = DecoratorConfigForTests.getNewInstance()
    this.registery = new TestEntityRegistery(this.globalSuite)
    this.decoratorConfig.registery = this.registery
  }

  @Test() async 'report no tests'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {}
    assertPrimitiveEqual(
      (await this.getConsoleCallsFromRunningSuite())
        .args().map(args => args[0]),
      ['Running tests...', 'Run successful, 0/0 passed.'],
    )
  }
  
  @Test() async 'report one skipped test'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({skip: true}, config) skip() { assert(false) }
    }
    assertPrimitiveEqual(
      (await this.getConsoleCallsFromRunningSuite())
        .args().map(args => args[0]),
      ['Running tests...', 'Run successful, 0/1 passed.'],
    )
  }

  @Test() async 'report one passing test'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({}, config) pass() { assert(true) }
    }
  }
  
  @Test() async 'report failing suite'() {
    let config = this.decoratorConfig
    @decorateSuite({}, config) class ExampleSuite extends TestSuite {
      @decorateTest({}, config) pass() { assert(true) }
      @decorateTest({skip: true}, config) skip() { assert(false) }
      @decorateTest({}, config) fail() { assert(false) }
    }
    let callArgs = (await this.getConsoleCallsFromRunningSuite()).args()
    assertIdentical(callArgs[0][0], 'Running tests...')
    assertIncludes(callArgs[1].join('\n'), 'Test "fail" failed:')
    assertIncludes(callArgs[1].join('\n'), 'Expected "false" to be truthy')
    assertIdentical(callArgs[2][0], 'Run failed, 1 failed, 1/3 passed.')
  }
  
  @Test() async 'report with only and skip'() {
    let config = this.decoratorConfig,
      runCount = 0,
      passingTest = () => runCount++,
      skipOpts: TestEntityOpts = {skip: true},
      onlyOpts: TestEntityOpts = {only: true},
      skipAndOnlyOpts: TestEntityOpts = {only: true, skip: true}
    
    @decorateSuite(skipAndOnlyOpts, config) class ShouldBeSkipped1 extends TestSuite {
      @decorateTest({}, config) shouldSkip1() { assert(false) }
      @decorateTest(onlyOpts, config) shouldSkip2() { assert(false) }
    }
    @decorateSuite(skipOpts, config) class ShouldBeSkipped2 extends TestSuite {
      @decorateTest({}, config) shouldSkip3() { assert(false) }
      @decorateTest(onlyOpts, config) shouldSkip4() { assert(false) }
    }
    @decorateSuite({}, config) class ShouldNotRun1 extends TestSuite {
      @decorateTest({}, config) shouldNotRun() { assert(false) }
      @decorateTest(onlyOpts, config) shouldRun() { passingTest() }
    }
    @decorateSuite(onlyOpts, config) class ShouldRun1 extends TestSuite {
      @decorateTest(skipOpts, config) shouldBeSkipped() { assert(false) }
      @decorateTest({}, config) shouldRun() { passingTest() }
    }
    @decorateSubSuite(ShouldRun1, {}, config) class ShouldRun2 extends TestSuite {
      @decorateTest(skipOpts, config) shouldBeSkipped() { assert(false) }
      @decorateTest({}, config) shouldRun() { passingTest() }
    }
    @decorateSuite(onlyOpts, config) class ShouldRun3 extends TestSuite {
      @decorateTest(onlyOpts, config) shouldRun() { passingTest() }
      @decorateTest({}, config) shouldNotRun() { assert(false) }
    }
    @decorateSubSuite(ShouldRun3, {}, config) class ShouldNotRun3 extends TestSuite {
      @decorateTest({}, config) shouldNotRun() { assert(false) }
    }
    let calls = await this.getConsoleCallsFromRunningSuite()
    assertIdentical(calls.args()[calls.args().length - 1][0], 'Run successful, 4/13 passed.', calls.args().join('\n'))
    assertIdentical(runCount, 4)
  }

  @Test() async 'register test class with decorators'() {
    let constructorCalledTimes = 0,
      setupCalledTimes = 0,
      beforeCalledTimes = 0,
      afterCalledTimes = 0,
      teardownCalledTimes = 0,
      waitMs = () => new Promise(resolve => setTimeout(resolve, 1)),
      config = this.decoratorConfig
    
    @decorateSuite({}, config)
    class ExampleSuite extends TestSuite {
      private counter = null
    
      constructor() {
        super()
        constructorCalledTimes++
        assertIdentical(this.counter, null)
        this.counter = -1
      }
      
      async setup() {
        setupCalledTimes++
        await waitMs()
        if (setupCalledTimes > 1)
        throw new Error('setup should be called once, and whatever it does should be the starting point of before')
        assertIdentical(this.counter, -1)
        this.counter = 2  
      }
      
      async before() {
        await waitMs()
        beforeCalledTimes++
        assertIdentical(this.counter, 2)
      }
      
      async after() {
        await waitMs()
        afterCalledTimes++
      }
      
      async teardown() {
        await waitMs()
        teardownCalledTimes++
      }
      
      @decorateTest({}, config) 'first test'() {
        this.counter *= 2
        assertIdentical(this.counter, 4)
      }
      
      @decorateTest({}, config) 'second test'() {
        this.counter *= 5
        assertIdentical(this.counter, 10)
      }
    
      @decorateTest({}, config) 'third test'() {
        assertIdentical(this.counter, 2)
      }
    }
    
    let calls = await this.getConsoleCallsFromRunningSuite()
    assertIdentical(calls.args()[calls().length - 1][0], 'Run successful, 3/3 passed.')
    assertIdentical(constructorCalledTimes, 1, 'Constructor should have been called once')
    assertIdentical(setupCalledTimes, 1, 'Setup should have been called once')
    assertIdentical(beforeCalledTimes, 3, 'Before should have been called thrice')
    assertIdentical(afterCalledTimes, 3, 'After should have been called thrice')
    assertIdentical(teardownCalledTimes, 1, 'Teardown should have been called once')
  }

  private async getConsoleCallsFromRunningSuite(rootSuite: Suite = this.globalSuite) {
    let consoleSpy = new ConsoleSpy,
      reporter = new SimpleTestReporter(rootSuite, consoleSpy)
    await new TestRunner(rootSuite, reporter).run()
    return consoleSpy.calls
  }
}
    
let global = GlobalSuite.getInstance()
new TestRunner(global, new SimpleTestReporter(global)).run()