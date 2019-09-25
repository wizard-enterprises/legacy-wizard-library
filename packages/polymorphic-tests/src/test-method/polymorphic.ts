import { TestMethod } from "."
import { TestSuite } from "../public-api/base-test-class"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { TestDecoratorOpts } from "../public-api/decorators"
import { TestEntityIdStore } from "../core/abstract-test-entity"

export class PolymorphicTestMethod extends TestMethod {
  constructor(
    name: string,
    boundMethod: Function,
    public opts: TestDecoratorOpts,
    private testSuite: TestSuite,
    idStore?: TestEntityIdStore
  ) {
    super(name, boundMethod, opts, idStore)
  }

  async run(reporter) {
    await super.run(reporter)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.testSuite.runTestPolymorphically(this.name, this.makeTestArg())
  }
}