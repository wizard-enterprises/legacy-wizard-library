import { TestReporter } from "../test-reporter"
import { Suite } from "../../suite"
import { TestEntity, TestEntityType, TestEntityStatus } from "../abstract-test-entity"
import { TestMethod } from "../../test-method"
import { Console } from '../../../test/mocks/console.mock'

export class SimpleTestReporter extends TestReporter {
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