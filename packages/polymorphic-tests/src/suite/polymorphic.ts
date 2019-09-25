import { Suite, SuiteOpts } from "."
import { TestSuite } from "../public-api/base-test-class"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { TestEntityIdStore } from "../core/abstract-test-entity"

export class PolymorphicSuite extends Suite {
  constructor(name: string, opts: SuiteOpts, private externalSuite: TestSuite, idStore?: TestEntityIdStore) {
    super(name, opts, idStore)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.externalSuite.setup()
    await super.runTestEntity(reporter)
    await this.externalSuite.teardown()
  }
}
