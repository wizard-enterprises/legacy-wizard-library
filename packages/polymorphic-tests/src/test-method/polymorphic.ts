import { TestMethod } from "."
import { TestSuite } from "../public-api/base-test-class"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { TestDecoratorOpts } from "../public-api/decorators"
import { TestEntityIdStore } from "../core/abstract-test-entity"
import { Observable, from } from "rxjs"

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

  superRunTestEntity = super.runTestEntity

  runTestEntity(reporter: TestReporterDelegate) {
    return (from(this.testSuite.runTestPolymorphically(reporter, this, this.makeTestArg()))) as Observable<void>
  }
}