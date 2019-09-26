import { TestMethod } from "../../test-method"
import { TestEntityStatus, TestEntity } from "../abstract-test-entity"
import { SummaryTestReporter } from "./test-reporter"
import { TestReporterType } from "."

export class TapReporter extends SummaryTestReporter {
  type = TestReporterType.tap
  async end() {
    await super.end()
    this.console.log(...this.makeEndReport())
  }

  makeEndReport() {
    return [
      'TAP version 13', `1..${this.testMethods.length}`,
      ...this.testMethods.map((m, i) => this.reportTestForTap(m, i + 1)),
    ]
  }

  makeDuration(entity: TestEntity) {
    return entity.end.getTime() - entity.start.getTime() + 'ms'
  }

  private reportTestForTap(method: TestMethod, index: number) {
    let testReport = `${this.getTestMethodStatus(method)} ${index} - ${method.id}`
    if (method.status === TestEntityStatus.skipped)
      testReport += ' # SKIP'
    return testReport
  }

  private getTestMethodStatus(method: TestMethod) {
    let isOk = method.status === TestEntityStatus.passed
      || method.status === TestEntityStatus.skipped
    return isOk ? 'ok' : 'not ok'
  }
}