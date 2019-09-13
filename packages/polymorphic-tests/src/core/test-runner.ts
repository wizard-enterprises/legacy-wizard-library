import { Suite } from "../suite"
import { TestReporter } from "./test-reporter"

export class TestRunner {
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