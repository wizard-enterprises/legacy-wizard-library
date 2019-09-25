import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSuite, decorateTest } from "../src/public-api/decorators";
import { TestRunningSuite } from "./test-running-suite";
import { TestEntityType, TestEntityStatus } from "../src/core/abstract-test-entity";

@Suite() class PlainTests extends TestRunningSuite {
  @Test() async 'run empty suite'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class EmptySuite extends TestSuite {}
    await this.runSuite()
    let report = this.reporter['makeEndReport']()
    t.assert(report instanceof Array)
    t.assert.identical(report.length, 1)
    let reportedSuite = report[0]
    t.assert.identical(reportedSuite.id, 'EmptySuite')
    t.assert.identical(reportedSuite.type, TestEntityType.suite)
    t.assert.identical(reportedSuite.status, TestEntityStatus.passed)
    t.assert.identical(reportedSuite.end.getTime(), reportedSuite.start.getTime())
  }
}