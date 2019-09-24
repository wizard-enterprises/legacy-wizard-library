import { TestMethod } from "../../test-method"
import { TestEntityStatus } from "../abstract-test-entity"
import { TestReporter } from "./test-reporter"
import { TestReporterType } from "."

export class TapReporter extends TestReporter {
  type = TestReporterType.tap
  async end() {
    this.console.log(this.makeEndReport())
  }

  makeEndReport() {
    let methods = this.entityCache.methods
    return [
      'TAP version 13', `1..${methods.length}`,
      ...methods.map((m, i) => this.reportTestForTap(m, i + 1))
    ].join('\n')
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