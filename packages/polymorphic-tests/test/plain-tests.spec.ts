import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../src/public-api/decorators";
import { RawTestRunningSuite } from './test-running-suite';

@Suite() export class PlainTests extends RawTestRunningSuite {
  @Test() async 'run empty suite'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class EmptySuite extends TestSuite {}
    let report = await this.runSuiteAndGetReport()
    t.expect(report).to.containSubset([this.suiteReport('EmptySuite')])
    t.expect(report).to.have.lengthOf(1)
  }

  @Test() async 'run suite with subsuite with empty tests'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ParentSuite extends TestSuite {
      @decorateTest(config) test() {}
    }
    @decorateSubSuite(config, ParentSuite) class ChildSuite extends TestSuite {
      @decorateTest(config) test() {}
    }
    t.expect(this.runSuiteAndGetReport()).to.eventually.containSubset([
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
    t.expect(report).to.containSubset([
      this.suiteReport('ExampleSuite', {children: [this.testReport('ExampleSuite: async test')]})
    ])
    let testReport = report[0].children[0]
    t.expect(testReport.end.getTime()).to.be.above(testReport.start.getTime() + testDuration)
  }
}
