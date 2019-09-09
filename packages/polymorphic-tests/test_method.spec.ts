import {ConsoleSpy, getEnvironmentalConsole, Console} from './console.mock'

class TestRunner {
  constructor(public rootSuite: TestSuite, public reporter: TestReporter) {}

  async run() {
    await this.reporter.start()
    await this.rootSuite.run(this.reporter.getDelegate())
    await this.reporter.end()
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
  public name: string
  public parentSuite: TestSuite
  public opts: TestEntityOpts
  private _status: TestEntityStatus = TestEntityStatus.pending
  public get status() { return this._status}

  private _shouldSkipBecauseOfOnly = false
  protected get shouldSkipBecauseOfOnly() { return this._shouldSkipBecauseOfOnly }
  protected set shouldSkipBecauseOfOnly(shouldSkipBecauseOfOnly) {
    this._shouldSkipBecauseOfOnly = shouldSkipBecauseOfOnly
    this.updateForSkipBecauseOfOnly()
  }

  protected updateForSkipBecauseOfOnly() {}

  constructor(name, opts: TestSuiteOpts | TestMethodOpts) {
    this.name = name
    this.opts = opts
    if (!this.opts['rootSuite'])
      this.parentSuite = GlobalTestSuite.getInstance()
  }

  public async run(reporter: TestReporterDelegate) {
    this.shouldSkipBecauseOfOnly = this.doesEntityHaveSubentitiesWithOnly(this) || this.opts.skipBecauseOfOnly
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
    let e: TestSuite = entity as TestSuite
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
  skip?: boolean,
  skipBecauseOfOnly?: boolean,
  only?: true,
}

interface TestSuiteOpts extends TestEntityOpts {
  rootSuite?: true
}
interface TestMethodOpts extends TestEntityOpts {}

class TestSuite extends TestEntity {
  public type = TestEntityType.suite
  public subTestEntities: TestEntity[] = []
  private _opts: TestSuiteOpts
  public get opts(): TestSuiteOpts { return this._opts }
  public set opts(opts: TestSuiteOpts) {
    this._opts = opts
    if (this.subTestEntities)
      this.applyOptsToSubEntities(this.subTestEntities)
  }
  protected updateForSkipBecauseOfOnly() {
    this.applyOptsToSubEntities(this.subTestEntities)
  }
  constructor(name, opts: TestSuiteOpts = {}) {
    super(name, opts)
  }

  addSubTestEntities(...testEntities: TestEntity[]) {
    this.subTestEntities = this.subTestEntities.concat(
      this.applyOptsToSubEntities(testEntities))
    return this
  }
  
  private applyOptsToSubEntities(entities: TestEntity[], opts: TestSuiteOpts = this.opts) {
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

class GlobalTestSuite extends TestSuite {
  private static instance = null
  static getInstance(opts: TestSuiteOpts = {}) {
    return this.instance || (this.instance = new GlobalTestSuite(opts))
  }

  protected constructor(opts: TestSuiteOpts = {}) {
    super('global', {...opts, rootSuite: true})//, only: true})
  }
}

class GlobalTestSuiteForTests extends GlobalTestSuite {
  static getNewInstance(opts: TestSuiteOpts = {}) {
    return new GlobalTestSuite(opts)
  }
}

class TestMethod extends TestEntity {
  public type = TestEntityType.test
  boundMethod: Function
  opts: TestMethodOpts
  constructor(name: string, boundMethod: Function, opts: TestMethodOpts = {}) {
    super(name, opts)
    this.boundMethod = boundMethod
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.boundMethod()
  }
}

class AssertionError extends Error {
  constructor(...args) {
    super(...args)
    if (Error.captureStackTrace) Error.captureStackTrace(this, AssertionError)
  }
}

function assertIncludes(a: string | Array<any>, b, message?) {
  assert(a.includes(b), `Expected "${b}" to be included in "${a}"`)
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

  constructor(protected rootSuite: TestSuite) {}
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

class SimpleTestReporter extends TestReporter {
  console
  constructor(rootSuite: TestSuite, console = getEnvironmentalConsole()) {
    super(rootSuite)
    this.console = console
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

async function getConsoleCallsFromRunningSuite(rootSuite: TestSuite) {
  let consoleSpy = new ConsoleSpy,
    reporter = new SimpleTestReporter(rootSuite, consoleSpy)
  await new TestRunner(rootSuite, reporter).run()
  return consoleSpy.calls
}

GlobalTestSuite.getInstance().addSubTestEntities(
  new TestSuite('simple flows').addSubTestEntities(
    new TestMethod('report no tests', async () => {
      assertPrimitiveEqual(
        (await getConsoleCallsFromRunningSuite(
          GlobalTestSuiteForTests.getNewInstance(),
        )).args().map(args => args[0]),
        ['Running tests...', 'Run successful, 0/0 passed.'],
      )
    }),
    
    new TestMethod('report one skipped test', async () => {
      assertPrimitiveEqual(
        (await getConsoleCallsFromRunningSuite(
          GlobalTestSuiteForTests.getNewInstance().addSubTestEntities(
            new TestMethod('skip', () => assert(false), {skip: true}),
          ),
        )).args().map(args => args[0]),
        ['Running tests...', 'Run successful, 0/1 passed.'],
      )
    }),
    
    new TestMethod('report one passing test', async () => {
      assertPrimitiveEqual(
        (await getConsoleCallsFromRunningSuite(
          GlobalTestSuiteForTests.getNewInstance().addSubTestEntities(
            new TestMethod('pass', () => assert(true)),
          ),
        )).args().map(args => args[0]),
        ['Running tests...', 'Run successful, 1/1 passed.'],
      )
    }),

    new TestMethod('report failing suite', async () => {
      let callArgs = (await getConsoleCallsFromRunningSuite(
        GlobalTestSuiteForTests.getNewInstance().addSubTestEntities(
          new TestMethod('pass', () => assert(true)),
          new TestMethod('skip', () => assert(false), {skip: true}),
          new TestMethod('failing', () => assert(false)),
        ),
      )).args()
      assertIdentical(callArgs[0][0], 'Running tests...')
      assertIncludes(callArgs[1].join('\n'), 'Test "failing" failed:')
      assertIncludes(callArgs[1].join('\n'), 'Expected "false" to be truthy')
      assertIdentical(callArgs[2][0], 'Run failed, 1 failed, 1/3 passed.')
    }),

    new TestMethod('report with only and skip', async () => {
      let runCount = 0,
        passingTest = () => runCount++,
        skipOpts: TestEntityOpts = {skip: true},
        onlyOpts: TestEntityOpts = {only: true, skip: false},
        skipAndOnlyOpts: TestEntityOpts = {only: true, skip: true}
      let calls = await getConsoleCallsFromRunningSuite(
        GlobalTestSuiteForTests.getNewInstance().addSubTestEntities(
          new TestSuite('should be skipped', skipAndOnlyOpts).addSubTestEntities(
            new TestMethod('should be skipped', () => assert(false)),
            new TestMethod('should be skipped', () => assert(false), onlyOpts),
            ),
          new TestSuite('should be skipped', skipOpts).addSubTestEntities(
            new TestMethod('should be skipped', () => assert(false)),
            new TestMethod('should be skipped', () => assert(false), onlyOpts),
          ),
          new TestSuite('should not run').addSubTestEntities(
            new TestMethod('should not run', () => assert(false)),
            new TestMethod('should run', passingTest, onlyOpts),
          ),
          new TestSuite('should run', onlyOpts).addSubTestEntities(
            new TestMethod('should be skipped', () => assert(false), skipOpts),
            new TestMethod('should run', passingTest),
            new TestSuite('should not run').addSubTestEntities(
              new TestMethod('should run', passingTest, onlyOpts),
            ),
          ),
          new TestSuite('should run', onlyOpts).addSubTestEntities(
            new TestMethod('should run', passingTest, onlyOpts),
            new TestMethod('should not run', () => assert(false)),
          ),
        ),
      )
      assertIdentical(calls.args()[calls.args().length - 1][0], 'Run successful, 4/11 passed.')
      assertIdentical(runCount, 4)
    })
  )
)

let global = GlobalTestSuite.getInstance()
new TestRunner(global, new SimpleTestReporter(global)).run()