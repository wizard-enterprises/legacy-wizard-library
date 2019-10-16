import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../src/public-api/decorators";
import { RawTestRunnerSuite } from './test-runner-suite';

@Suite() export class PlainTests extends RawTestRunnerSuite {
  @Test() async 'throw if suite doesn\'t extend TestSuite'(t) {
    let config = this.decoratorConfig
    t.expect(() => {
      //@ts-ignore
      @decorateSuite(config) class InvalidSuite {}
    }).to.throw('Class "InvalidSuite" must extend TestSuite')
  }

  @Test() async 'run empty suite'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class EmptySuite extends TestSuite {}
    let report = await this.runSuiteAndGetReport()
    t.expect(report).to.shallowDeepEqual([this.suiteReport('EmptySuite')])
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
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ParentSuite', { children: [
        this.testReport('ParentSuite: test'),
        this.suiteReport('ParentSuite_ChildSuite', { children: [
          this.testReport('ParentSuite_ChildSuite: test')
        ]}),
      ]})
    ])
  }
}