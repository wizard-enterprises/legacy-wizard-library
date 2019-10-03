import { TestEntity, TestEntityIdStore, TestEntityOpts, TestEntityType } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
import chai from 'chai'
const chaiShould = chai.should()

export interface TestMethodOpts extends TestEntityOpts {}

export class TestMethod extends TestEntity<TestMethodOpts> {
  public type = TestEntityType.test

  constructor(name: string, public boundMethod: Function, opts: TestMethodOpts = {}, idStore?: TestEntityIdStore) {
    super(name, opts, idStore)
  }

  protected makeTestArg(): TestArg {
    return new TestArg(this)
  }

  public methodBinding?: Object
  public runTestEntity(reporter: TestReporterDelegate) {
    this.start = new Date
    this.testTimeout = this.testTimeout
    let boundMethod = this.methodBinding ? this.boundMethod.bind(this.methodBinding) : this.boundMethod
    return boundMethod(this.makeTestArg())
  }
}

export class TestArg {
  public assert = chai.assert
  public expect = chai.expect
  public should = chaiShould
  constructor(private entity: TestEntity) {}
  public set timeout(timeout: number) {
    this.entity.testTimeout = timeout
  }
  public get timeout() {
    return this.entity.testTimeout
  }
}