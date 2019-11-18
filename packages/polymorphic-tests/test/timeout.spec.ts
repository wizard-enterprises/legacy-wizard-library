import { PlainTests } from "./plain-tests.spec"
import { RawTestRunnerSuite } from "./test-runner-suite"
import { decorateSuite, decorateTest } from "../lib/public-api/decorators"
import { TestEntityStatus as Status } from "../lib/core/abstract-test-entity"
import { SubSuite, Test, TestSuite } from "../lib/public-api"

@SubSuite(PlainTests) class TestTimeoutSuite extends RawTestRunnerSuite {
  @Test() async 'run async test'(t) {
    let testDuration = 10, 
      config = this.decoratorConfig
    @decorateSuite(t.config) class ExampleSuite extends TestSuite {
      @decorateTest(t.config) 'async test'(t) {
        return new Promise(resolve => setTimeout(resolve, testDuration))
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.expect(report).to.shallowDeepEqual([
      this.suiteReport('ExampleSuite', {children: [this.testReport('ExampleSuite: async test')]})
    ])
    let testReport = report[0].children[0]
    t.expect(testReport.end.getTime()).to.be.at.least(testReport.start.getTime() + testDuration)
  }

  @Test() async 'timeout from suite config'(t) {
    @decorateSuite(t.config) class TimeoutSuite extends TestSuite {
      timeout = 5
      @decorateTest(t.config) async 'should timeout'(t) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.expect(report).to.shallowDeepEqual([
      this.suiteReport('TimeoutSuite', {status: Status.failed, children: [
        this.testReport('TimeoutSuite: should timeout', Status.failed),
      ]})
    ])
    t.expect(report[0].children[0].reason.message).to.include('"should timeout" timed out at 5ms')
  }

  @Test() async 'override timeout config in test'(t) {
    @decorateSuite(t.config) class TimeoutSuite extends TestSuite {
      timeout = 10
      @decorateTest(t.config) async 'should not timeout'(t) {
        t.timeout = 30
        await new Promise(resolve => setTimeout(resolve, 20))
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.expect(report).to.shallowDeepEqual([
      this.suiteReport('TimeoutSuite', {children: [
        this.testReport('TimeoutSuite: should not timeout'),
      ]})
    ])
  }

  @Test() async 'fail when overriding with shorter timeout than current duration'(t) {
    @decorateSuite(t.config) class TimeoutSuite extends TestSuite {
      timeout = 20
      @decorateTest(t.config) async 'should timeout'(t) {
        await new Promise(resolve => setTimeout(resolve, 2))
        t.timeout = 1
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.expect(report).to.shallowDeepEqual([
      this.suiteReport('TimeoutSuite', {status: Status.failed, children: [
        this.testReport('TimeoutSuite: should timeout', Status.failed)
      ]})
    ])
    let errorMessage = report[0].children[0].reason.message
    t.expect(errorMessage).to.include('"should timeout" changed timeout to 1ms,')
    let passedTime = Number(/but (\d+)ms passed/.exec(errorMessage)[1])
    t.expect(passedTime).to.be.within(1, 19)
  }

  // Undesired but unavoidable.
  @Test() async 'timed out test should not stop executing'(t) {
    let continuedExecution = false
    @decorateSuite(t.config) class TimeoutSuite extends TestSuite {
      timeout = 1
      @decorateTest(t.config) async 'should timeout'(t) {
        await new Promise(resolve => setTimeout(resolve, 2))
        continuedExecution = true
      }
    }
    await this.runSuiteAndGetReport().then(() => new Promise(res => setTimeout(res, 2)))
    t.expect(continuedExecution).to.equal(true)
  }
}
