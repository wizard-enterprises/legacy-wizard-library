import { Suite, SuiteOpts } from "."
import { TestEntityIdStore } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { TestSuite } from "../public-api"

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
    if (this.shouldSkipEntity(this) || this.opts.skip) {
      await super.runTestEntity(reporter)
    } else {
      try {
        await this.externalSuite.setup()
        await super.runTestEntity(reporter)
      } catch (e) {
        throw e
      } finally {
        await this.externalSuite.teardown()
      }
    }
  }
}
