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
      this.parentSuite
        ? `_${this.parentSuite.id}_`
        : null, this.name
      ].filter(Boolean).join('_') 
  }
  public name: string
  public parentSuite: TestSuite = null
  public opts: TestEntityOpts
  private _status: TestEntityStatus = TestEntityStatus.pending
  public get status() { return this._status}

  constructor(name, opts: TestEntityOpts) {
    this.name = name
    this.opts = opts
  }

  public async run(reporter: TestReporterDelegate) {
    if (this.opts.skip) return reporter.testEntitySkipped(this)
    reporter.testEntityIsExecuting(this)
    try {
      await this.runTestEntity(reporter)
      reporter.testEntityPassed(this)
    } catch (e) {
      let reasons = this.failureReasonsOverride.length ? this.failureReasonsOverride : [e]
      reporter.testEntityFailed(this, ...reasons)
    }
  }

  protected failureReasonsOverride: Error[] = []

  protected abstract runTestEntity(reporter: TestReporterDelegate)

  public setStatus(status: TestEntityStatus) {
    this._status = status
  }
}

interface TestEntityOpts {
  skip?: true
}

interface TestSuiteOpts extends TestEntityOpts {}
interface TestMethodOpts extends TestEntityOpts {}

class TestSuite extends TestEntity {
  public type = TestEntityType.suite
  public opts: TestSuiteOpts
  subTestEntities: Array<TestEntity> = []
  constructor(name, opts: TestSuiteOpts = {}) {
    super(name, opts)
  }

  addSubTestEntities(...testEntities: TestEntity[]) {
    for (let entity of testEntities)
      entity.parentSuite = this
    this.subTestEntities = this.subTestEntities.concat(testEntities)
    return this
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    for (let testEntity of this.subTestEntities)
      await testEntity.run(reporter)
  }
}

class GlobalTestSuite extends TestSuite {
  private instance = null
  constructor(opts: any = {}) {
    super('global', opts)
    if (this.instance) return this.instance
    this.parentSuite = null
    this.instance = this
    return this.instance
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
    //@ts-ignore
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
    this.console.log('Running tests...\n')
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

let suite = new TestSuite('simple reporter').addSubTestEntities(
  new TestMethod('report no tests', async () => {
    assertPrimitiveEqual(
      (await getConsoleCallsFromRunningSuite(
        new TestSuite('test'),
      )).args().map(args => args[0]),
      ['Running tests...\n', 'Run successful, 0/0 passed.'],
    )
  }),
  
  new TestMethod('report one skipped test', async () => {
    assertPrimitiveEqual(
      (await getConsoleCallsFromRunningSuite(
        new TestSuite('test').addSubTestEntities(
          new TestMethod('skip', () => assert(false), {skip: true}),
        ),
      )).args().map(args => args[0]),
      ['Running tests...\n', 'Run successful, 0/1 passed.'],
    )
  }),
  
  new TestMethod('report one passing test', async () => {
    assertPrimitiveEqual(
      (await getConsoleCallsFromRunningSuite(
        new TestSuite('test').addSubTestEntities(
          new TestMethod('pass', () => assert(true)),
        ),
      )).args().map(args => args[0]),
      ['Running tests...\n', 'Run successful, 1/1 passed.'],
    )
  }),

  new TestMethod('report failing suite', async () => {
    let callArgs = (await getConsoleCallsFromRunningSuite(
      new TestSuite('test').addSubTestEntities(
        new TestMethod('pass', () => assert(true)),
        new TestMethod('skip', () => assert(false), {skip: true}),
        new TestMethod('failing', () => assert(false)),
      ),
    )).args()
    assertIdentical(callArgs[0][0], 'Running tests...\n')
    assertIncludes(callArgs[1].join('\n'), 'Test "failing" failed:')
    assertIncludes(callArgs[1].join('\n'), 'Expected "false" to be truthy')
    assertIdentical(callArgs[2][0], 'Run failed, 1 failed, 1/3 passed.')
  })
)

new TestRunner(suite, new SimpleTestReporter(suite)).run()