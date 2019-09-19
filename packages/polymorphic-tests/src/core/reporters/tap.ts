import { TestMethod } from "../../test-method"
import { TestEntityStatus } from "../abstract-test-entity"
import { TestReporter } from "../test-reporter"

export class TapReporter extends TestReporter {
  async end() {
    console.log(this.makeEndReport())
  }

  makeEndReport() {
    let methods = this.entityCache.methods
    return ['TAP version 13', `1..${methods.length}`, ...methods.map((m, i) => this.reportTestForTap(m, i + 1))].join('\n')
  }

  private reportTestForTap(method: TestMethod, index: number) {
    let tapStatus = method.status === TestEntityStatus.passed || method.status === TestEntityStatus.skipped
      ? 'ok'
      : 'not ok',
      testReport = `${tapStatus} ${index} - ${method.id}`
    if (method.status === TestEntityStatus.skipped)
      testReport += ' # SKIP'
    return testReport
  }
}