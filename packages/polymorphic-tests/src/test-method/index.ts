import { TestEntityOpts, TestEntity, TestEntityType } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/reporters/test-reporter"

export interface TestMethodOpts extends TestEntityOpts {}

export class TestMethod extends TestEntity {
  public type = TestEntityType.test
  opts: TestMethodOpts
  constructor(name: string, public boundMethod: Function, opts: TestMethodOpts = {}) {
    super(name, opts)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.boundMethod()
  }
}
