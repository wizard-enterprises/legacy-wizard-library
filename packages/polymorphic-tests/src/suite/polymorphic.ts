import { Suite, SuiteOpts } from "."
import { TestSuite } from "../public-api/base-test-class"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { TestEntityIdStore } from "../core/abstract-test-entity"
import { from } from "rxjs"

export class PolymorphicSuite extends Suite {
  constructor(name: string, opts: SuiteOpts, private externalSuite: TestSuite, idStore?: TestEntityIdStore) {
    super(name, parseOpts(opts), idStore)

    function parseOpts(opts: SuiteOpts) {
      let hasTimeout = ({timeout}) => timeout || timeout === 0,
        o = {...opts}
      //@ts-ignore
      if (hasTimeout(externalSuite))
        o.timeout = externalSuite.timeout
      return o
    }
  }

  runTestEntity(reporter: TestReporterDelegate) {
    return (from((async () => {
      await this.externalSuite.setup()
      await super.runTestEntity(reporter).toPromise()
      await this.externalSuite.teardown()
    })()))
  }
}
