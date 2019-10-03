import { Suite, SuiteOpts } from "."
import { TestEntityIdStore } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { TestSuite } from "../public-api/base-test-class"

export class PolymorphicSuite extends Suite {
  constructor(name: string, opts: SuiteOpts, private externalSuite: TestSuite, idStore?: TestEntityIdStore) {
    super(name, parseOpts(opts), idStore)
    function parseOpts(opts: SuiteOpts) {
      let hasTimeout = ({timeout}) => timeout || timeout === 0,
        o = {...opts}
      //@ts-ignore
      if (hasTimeout(externalSuite)) {
        o.timeout = externalSuite.timeout
      }
      return o
    }
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.externalSuite.setup()
    await super.runTestEntity(reporter)
    await this.externalSuite.teardown()
  }
}
