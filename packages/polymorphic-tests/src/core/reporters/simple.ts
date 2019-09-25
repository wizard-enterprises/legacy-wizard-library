import { TestReporter } from "./test-reporter"
import { TestEntity, TestEntityType, TestEntityStatus } from "../abstract-test-entity"
import { TestMethod } from "../../test-method"
import { TestReporterType } from "."

export class SimpleTestReporter extends TestReporter {
  type = TestReporterType.simple
  async start() {
    await super.start()
    this.console.log('Running tests...')
  }
  
  async end() {
    await super.end()
    this.console.log(this.makeEndReport())
  }

  protected testEntityFailed(entity: TestEntity, ...reasons: Error[]) {
    super.testEntityFailed(entity, ...reasons)
    if (entity.type === TestEntityType.test)
      this.reportTestFailure(entity as TestMethod, ...reasons)
  }

  private reportTestFailure(entity: TestMethod, ...reasons: Error[]) {
    this.console.error(`Test "${entity.name}" failed:`, ...reasons)
  }

  makeEndReport() {
    let passingTestsReport = `${this.passingTests.length}/${this.testMethods.length} passed`,
      runReport = this.failingTests.length
        ? `Run failed, ${this.failingTests.length} failed`
        : `Run successful`
    return `${runReport}, ${passingTestsReport}.`
  }
}