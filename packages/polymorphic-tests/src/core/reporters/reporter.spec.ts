import { TestReportForTests, TestRunningSuite } from "../../../test/test-running-suite";
import { Test, TestSuite } from "../../public-api";
import { decorateSuite, decorateTest } from "../../public-api/decorators";
import { TestReporterType, getReporterOfType } from ".";
import { SummaryTestReporter } from "./test-reporter";

export abstract class SummaryReporterTestSuite extends TestRunningSuite {
  reporter: SummaryTestReporter
  async before() {
    await super.before()
    this.reporter = new (getReporterOfType(this.reporterType)) as SummaryTestReporter
  }

  @Test() async 'aggregates test results'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ExampleSuite extends TestSuite {
      @decorateTest(config, {skip: true, only: true}) skip(t) { t.assert(false) }
      @decorateTest(config) skipBecauseNotOnly(t) { t.assert(false) }
      @decorateTest(config, {only: true}) fail(t) { t.assert(false) }
      @decorateTest(config, {only: true}) pass(t) { t.assert(true) }
    }
    // @decorateSuite(config, {skip: true}) class ExampleSkippedSuite extends ExampleSuite {
    //   @decorateTest(config) skipInSuite() { assert(false) }
    // }
    class ExampleSkippedSuite {skipInSuite() {}}
    let report = await this.runSuiteAndGetReport()
    console.log('failingTests', this.reporter.failingTests.length, this.reporter.failingTests.map(f => f.name))
    console.log('skippedTests', this.reporter.skippedTests.length, this.reporter.skippedTests.map(f => f.name))
    console.log('passingTests', this.reporter.passingTests.length, this.reporter.passingTests.map(f => f.name))
    t.assert.deepEqual(
      [
        this.reporter.failingTests, this.reporter.skippedTests, this.reporter.passingTests,
      ].map(tests => tests.map(method => method.boundMethod)),
      [
        [ExampleSuite.prototype.fail],
        [ExampleSuite.prototype.skip, ExampleSuite.prototype.skipBecauseNotOnly, ExampleSkippedSuite.prototype.skipInSuite],
        [ExampleSuite.prototype.pass],
      ]
    )
    this.validateBasicSuiteReport(report)
  }

  protected abstract validateBasicSuiteReport(report: TestReportForTests)
}