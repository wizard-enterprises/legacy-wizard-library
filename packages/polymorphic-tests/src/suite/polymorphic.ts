import { Suite, SuiteOpts } from "."
import { TestSuite } from "../public-api/base-test-class"
import { TestReporterDelegate } from "../core/reporters/test-reporter"

export class PolymorphicSuite extends Suite {
  constructor(name: string, opts: SuiteOpts, private externalSuite: TestSuite) {
    super(name, opts)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.externalSuite.setup()
    await super.runTestEntity(reporter)
    await this.externalSuite.teardown()
  }
}
