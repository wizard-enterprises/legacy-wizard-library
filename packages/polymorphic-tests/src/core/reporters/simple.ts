import { SummaryTestReporter } from "./test-reporter"
import { TestEntity, TestEntityType, TestEntityStatus } from "../abstract-test-entity"
import { TestMethod } from "../../test-method"
import { TestReporterType } from "."

export class SimpleTestReporter extends SummaryTestReporter {
  type = TestReporterType.simple
  async start() {
    await super.start()
    this.console.log('Running tests...')
  }
  
  async end() {
    await super.end()
    this.console.log(this.makeEndReport())
  }

  public testEntityFailed(entity: TestEntity, reason: Error) {
    super.testEntityFailed(entity, reason)
    if (entity.type === TestEntityType.test)
      this.reportTestFailure(entity as TestMethod, reason)
  }

  private reportTestFailure(entity: TestMethod, reason: Error) {
    this.console.error(`
Test "${entity.name}" failed:
  ${reason.stack}`
  )
  }

  makeEndReport() {
    let passingTestsReport = `${this.passingTests.length}/${this.testMethods.length} passed`,
      runReport = this.failingTests.length
        ? `Run failed, ${this.failingTests.length} failed`
        : `Run successful`
    return `${runReport}, ${passingTestsReport}.`
  }
}