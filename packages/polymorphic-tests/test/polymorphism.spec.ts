import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../src/public-api/decorators";
import { RawTestRunningSuite } from './test-running-suite';

@Suite() class Polymorphism extends RawTestRunningSuite {
  @Test() async 'instance should be cloned after setup for every test'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class CloneInstancePerTest extends TestSuite {
      i: number
      setup() {
        this.i = 10
      }
      @decorateTest(config) 'test 1'(t) {
        this.i *= 2
        t.expect(this.i).to.equal(20)
      }
      @decorateTest(config) 'test 2'(t) {
        this.i *= 3
        t.expect(this.i).to.equal(30)
      }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('CloneInstancePerTest', {children: [
        this.testReport('CloneInstancePerTest: test 1'),
        this.testReport('CloneInstancePerTest: test 2'),
      ]}),
    ])
  }
}
