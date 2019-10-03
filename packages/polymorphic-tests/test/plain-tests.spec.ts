import { Suite, SubSuite, Test, TestSuite } from "../src/public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../src/public-api/decorators";
import { RawTestRunningSuite } from './test-running-suite';
import { TestEntityStatus as Status } from "../src/core/abstract-test-entity"

@Suite() export class PlainTests extends RawTestRunningSuite {
  @Test() async 'run empty suite'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class EmptySuite extends TestSuite {}
    let report = await this.runSuiteAndGetReport()
    t.assert.objectMatches(report, [this.suiteReport('EmptySuite')])
    t.assert.identical(report.length, 1)
  }

  @Test() async 'run suite with subsuite with empty tests'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ParentSuite extends TestSuite {
      @decorateTest(config) test() {}
    }
    @decorateSubSuite(config, ParentSuite) class ChildSuite extends TestSuite {
      @decorateTest(config) test() {}
    }
    t.assert.objectMatches(await this.runSuiteAndGetReport(), [
      this.suiteReport('ParentSuite', { children: [
        this.testReport('ParentSuite: test'),
        this.suiteReport('ParentSuite_ChildSuite', { children: [
          this.testReport('ParentSuite_ChildSuite: test')
        ]}),
      ]})
    ])
  }

  @Test() async 'run async test'(t) {
    let testDuration = 10, 
      config = this.decoratorConfig
    @decorateSuite(config) class ExampleSuite extends TestSuite {
      @decorateTest(config) 'async test'(t) {
        return new Promise(resolve => setTimeout(resolve, testDuration))
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.assert.objectMatches(report, [
      this.suiteReport('ExampleSuite', {children: [this.testReport('ExampleSuite: async test')]})
    ])
    let testReport = report[0].children[0]
    t.assert(testReport.end.getTime() > testReport.start.getTime() + testDuration)
  }
}

@SubSuite(PlainTests) class AssertionReportingSuite extends RawTestRunningSuite {
  @Test() async 'report passing assertion'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class AssertionSuite extends TestSuite {
      @decorateTest(config) 'passing test'(t) {
        t.assert(true)
      }
    }
    let report = await this.runSuiteAndGetReport()
    t.assert.objectMatches(report, [
      this.suiteReport('AssertionSuite', {children: [
        this.testReport('AssertionSuite: passing test', Status.passed, {assertions: [
          this.assertionReport(Status.passed, true, true),
        ]})
      ]})
    ])
  }

  private assertionReport(status: Status.passed | Status.failed, expected, actual) {
    return {
      status, expected, actual,
    }
  }
}