import { Suite } from "../suite"
import { TestReporter } from "./reporters/test-reporter"

export class TestRunner {
  constructor(public rootSuite: Suite, public reporter: TestReporter) {}

  async run() {
    await this.reporter.start()
    await this.rootSuite.run(this.reporter.getDelegate())
    await this.reporter.end()
  }
}