import chai from 'chai'
import { TestEntity, TestEntityIdStore, TestEntityOpts, TestEntityType } from "../core/abstract-test-entity"
import { TestReporterDelegate } from "../core/reporters/test-reporter"
const chaiShould = chai.should()

export interface TestMethodOpts extends TestEntityOpts {}

export class TestMethod extends TestEntity<TestMethodOpts> {
  public type = TestEntityType.test

  constructor(name: string, public boundMethod: Function, opts: TestMethodOpts = {}, idStore?: TestEntityIdStore) {
    super(name, opts, idStore)
  }

  protected makeTestArg(): TestArg {
    return new TestArg({
      getTestTimeout: () => this.testTimeout,
      setTestTimeout: (testTimeout: number) => this.testTimeout = testTimeout
    })
  }

  public methodBinding?: Object
  public runTestEntity(reporter: TestReporterDelegate, testArg?: TestArg) {
    this.start = new Date
    this.testTimeout = this.testTimeout
    let boundMethod = this.methodBinding ? this.boundMethod.bind(this.methodBinding) : this.boundMethod
    return boundMethod(testArg || this.makeTestArg())
  }
}

export interface TestArgDelegate {
  getTestTimeout(): number
  setTestTimeout(testTimeout: number): void
}

export class TestArg {
  public assert = chai.assert
  public expect = chai.expect
  public should = chaiShould
  constructor(private delegate: TestArgDelegate) {}
  public set timeout(timeout: number) {
    this.delegate.setTestTimeout(timeout)
  }
  public get timeout() {
    return this.delegate.getTestTimeout()
  }
}