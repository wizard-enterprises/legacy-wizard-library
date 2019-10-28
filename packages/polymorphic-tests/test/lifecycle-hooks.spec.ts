import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../src/public-api/decorators";
import { RawTestRunnerSuite } from './test-runner-suite';
import { TestEntityStatus } from "../src/core/abstract-test-entity";

@Suite() class LifecycleHooks extends RawTestRunnerSuite {
  @Test() async 'hooks run in correct order'(t) {
    let config = this.decoratorConfig,
      timeline = []
    @decorateSuite(config) class CorrectHookOrder extends TestSuite {
      constructor() {
        super()
        timeline.push('constructor')
      }

      setup() { timeline.push('setup') }
      before() { timeline.push('before') }
      @decorateTest(config) 'test 1'() { timeline.push('test 1') }
      @decorateTest(config) 'test 2'() { timeline.push('test 2') }
      after() { timeline.push('after') }
      teardown() { timeline.push('teardown') }
    }
    await this.runSuite()
    t.expect(timeline).to.deep.equal([
      'constructor',
      'setup',
      'before', 'test 1', 'after',
      'before', 'test 2', 'after',
      'teardown',
    ])
  }

  @Test() async 'failed test should still run after'(t) {
    let config = this.decoratorConfig,
      didAfterRun = false
    @decorateSuite(config) class FailedTestWithAfter extends TestSuite {
      @decorateTest(config) 'failing'(t) {
        t.expect(true).to.equal(false)
      }
      after(t) {
        didAfterRun = true
      }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('FailedTestWithAfter', { status: TestEntityStatus.failed, children: [
        this.testReport('FailedTestWithAfter: failing', TestEntityStatus.failed),
      ]}),
    ])
    t.expect(didAfterRun).to.equal(true)
  }

  @Test() async 'failure in before should not run test but still run after'(t) {
    let config = this.decoratorConfig,
      didTestRun = false,
      didAfterRun = false
    @decorateSuite(config) class FailedBeforeWithAfter extends TestSuite {
      before(t) {
        t.expect(true).to.equal(false)
      }
      after(t) {
        didAfterRun = true
      }
      @decorateTest(config) 'test'(t) {
        didTestRun = true
      }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('FailedBeforeWithAfter', { status: TestEntityStatus.failed, children: [
        this.testReport('FailedBeforeWithAfter: test', TestEntityStatus.failed),
      ]}),
    ])
    t.expect(didTestRun).to.equal(false)
    t.expect(didAfterRun).to.equal(true)
  }

  @Test() async 'allow before to modify test arg'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ModifyTestArg extends TestSuite {
      wasSet = false
      before(t) {
        super.before(t)
        t.doThing = () => this.wasSet = true
      }
      @decorateTest(config) 'should have modified test arg'(t) {
        t.expect(this.wasSet).to.equal(false)
        t.expect(t.doThing).to.be.a('function')
        t.doThing()
        t.expect(this.wasSet).to.equal(true)
      }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ModifyTestArg', { children: [
        this.testReport('ModifyTestArg: should have modified test arg'),
      ]}),
    ])
  }
}
