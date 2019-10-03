import { PlainTests } from "./plain-tests.spec"
import { RawTestRunningSuite } from "./test-running-suite"
import { decorateSuite, decorateTest } from "../src/public-api/decorators"
import { TestEntityStatus as Status } from "../src/core/abstract-test-entity"
import { SubSuite, Test, TestSuite } from "../src/public-api"

@SubSuite(PlainTests) class TestTimeoutSuite extends RawTestRunningSuite {
  @Test() async 'timeout from suite config'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class TimeoutSuite extends TestSuite {
      timeout = 5
      @decorateTest(config) async 'should timeout'(t) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.assert.objectMatches(report, [
      this.suiteReport('TimeoutSuite', {status: Status.failed, children: [
        this.testReport('TimeoutSuite: should timeout', Status.failed),
      ]})
    ])
    t.assert.includes(report[0].children[0].reason.message, '"should timeout" timed out at 5ms')
  }

  @Test() async 'override timeout config in test'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class TimeoutSuite extends TestSuite {
      timeout = 5
      @decorateTest(config) async 'should not timeout'(t) {
        t.timeout = 20
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.assert.objectMatches(report, [
      this.suiteReport('TimeoutSuite', {children: [
        this.testReport('TimeoutSuite: should not timeout'),
      ]})
    ])
  }

  @Test() async 'fail when overriding with shorter timeout than current duration'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class TimeoutSuite extends TestSuite {
      timeout = 5
      @decorateTest(config) async 'should timeout'(t) {
        await new Promise(resolve => setTimeout(resolve, 2))
        t.timeout = 1
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.assert.objectMatches(report, [
      this.suiteReport('TimeoutSuite', {status: Status.failed, children: [
        this.testReport('TimeoutSuite: should timeout', Status.failed)
      ]})
    ], report)
    let errorMessage = report[0].children[0].reason.message
    t.assert.includes(errorMessage, '"should timeout" changed timeout to 1ms,')
    let passedTime = Number(/but (\d+)ms passed/.exec(errorMessage)[1])
    t.assert(
      passedTime > 0 && passedTime <= 5,
      `Expected 1-5ms to have passed in error message "${errorMessage}"`)
  }

  // Undesired but unavoidable.
  @Test() async 'timed out test should not stop executing'(t) {
    let config = this.decoratorConfig,
      continuedExecution = false
    @decorateSuite(config) class TimeoutSuite extends TestSuite {
      timeout = 1
      @decorateTest(config) async 'should timeout'(t) {
        await new Promise(resolve => setTimeout(resolve, 1))
        continuedExecution = true
      }
    }
    await this.runSuiteAndGetReport().then(() => new Promise(res => setTimeout(res, 1)))
    t.assert(continuedExecution)
  }
}
