import { TestArg, TestMethod } from "."
import { TestEntityIdStore } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { TestSuite } from "../public-api/base-test-class"
import { TestDecoratorOpts } from "../public-api/decorators"

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

  superRunTestEntity = super.runTestEntity.bind(this)

  runTestEntity(reporter: TestReporterDelegate, testArg?: TestArg) {
    return this.testSuite.runTestPolymorphically(reporter, this, testArg || this.makeTestArg())
  }
}