import { TestMethod } from "."
import { TestSuite } from "../public-api/base-test-class"
import { TestReporterDelegate } from "../core/test-reporter"
import { TestDecoratorOpts } from "../public-api/decorators"

export class PolymorphicTestMethod extends TestMethod {
  constructor(
    name: string,
    boundMethod: Function,
    public opts: TestDecoratorOpts,
    private testSuite: TestSuite,
  ) {
    super(name, boundMethod, opts)
  }

  async run(reporter) {
    await super.run(reporter)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.testSuite.runTestPolymorphically(this.name)
  }
}