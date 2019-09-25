import { TestEntityOpts, TestEntity, TestEntityType, TestEntityIdStore } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import { assert } from "../core/assert"

export interface TestMethodOpts extends TestEntityOpts {}

export class TestMethod extends TestEntity {
  public type = TestEntityType.test
  opts: TestMethodOpts
  constructor(name: string, public boundMethod: Function, opts: TestMethodOpts = {}, idStore?: TestEntityIdStore) {
    super(name, opts, idStore)
  }

  async runTestEntity(reporter: TestReporterDelegate) {
    await this.boundMethod(this.makeTestArg())
  }

  protected makeTestArg(): TestArg {
    return {
      assert,
    }
  }
}

export interface TestArg {
  assert: typeof assert,
}