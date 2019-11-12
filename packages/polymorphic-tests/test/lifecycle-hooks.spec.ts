import { TestEntityStatus } from "../src/core/abstract-test-entity"
import { Suite, Test, TestSuite } from "../src/public-api"
import { decorateSuite, decorateSubSuite, decorateTest } from "../src/public-api/decorators"
import { RawTestRunnerSuite } from './test-runner-suite'

@Suite() class LifecycleHooks extends RawTestRunnerSuite {
  @Test() async 'hooks run in correct order'(t) {
    let timeline = []
    @decorateSuite(t.config) class CorrectHookOrder extends TestSuite {
      constructor() {
        super()
        timeline.push('constructor')
      }

      setup() { timeline.push('setup') }
      before() { timeline.push('before') }
      @decorateTest(t.config) 'test 1'() { timeline.push('test 1') }
      @decorateTest(t.config) 'test 2'() { timeline.push('test 2') }
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
    let didAfterRun = false
    @decorateSuite(t.config) class FailedTestWithAfter extends TestSuite {
      @decorateTest(t.config) 'failing'(t) {
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
    let didTestRun = false,
      didAfterRun = false
    @decorateSuite(t.config) class FailedBeforeWithAfter extends TestSuite {
      before(t) {
        t.expect(true).to.equal(false)
      }
      after(t) {
        didAfterRun = true
      }
      @decorateTest(t.config) 'test'(t) {
        didTestRun = true
      }
    }
    let report
    t.expect(report = await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('FailedBeforeWithAfter', { status: TestEntityStatus.failed, children: [
        this.testReport('FailedBeforeWithAfter: test', TestEntityStatus.failed),
      ]}),
    ])
    t.expect(didTestRun).to.equal(false)
    t.expect(didAfterRun).to.equal(true)
    t.expect(report[0].end).to.be.an.instanceof(Date)
    t.expect(report[0].children[0].end).to.be.an.instanceof(Date)
  }

  @Test() async 'failed test suite should still run teardown'(t) {
    let didTeardownRunAfter = {
      testFailure: false,
      setupFailure: false,
    }
    @decorateSuite(t.config) class FailureInTest extends TestSuite {
      teardown() {
        super.teardown()
        didTeardownRunAfter.testFailure = true
      }
      @decorateTest(t.config) 'failing'(t) {
        t.expect(true).to.equal(false)
      }
    }
    @decorateSuite(t.config) class FailureInSetup extends TestSuite {
      teardown() {
        super.teardown()
        didTeardownRunAfter.setupFailure = true
      }
      setup() {
        throw new Error('setup error')
      }
    }
    let report
    t.expect(report = await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('FailureInTest', {status: TestEntityStatus.failed, children: [
        this.testReport('FailureInTest: failing', TestEntityStatus.failed),
      ]}),
      this.suiteReport('FailureInSetup', {status: TestEntityStatus.failed}),
    ])
    t.expect(didTeardownRunAfter).to.deep.equal({
      testFailure: true,
      setupFailure: true,
    })
    t.expect(report[0].end).to.be.an.instanceof(Date)
    t.expect(report[1].end).to.be.an.instanceof(Date)
  }

  @Test() async 'do not run setup and teardown for skipped suites'(t) {
    let suiteHookRuns = []
    class CountingTestSuite extends TestSuite {
      setup() {
        super.setup()
        suiteHookRuns.push(this.constructor.name + ' setup')
      }
      teardown() {
        super.teardown()
        suiteHookRuns.push(this.constructor.name + ' teardown')
      }
    }
    @decorateSuite(t.config) class SkippedFromOnly extends CountingTestSuite {
      @decorateTest(t.config) 'should not run'(t) { t.expect(true).to.equal(false) }
    }
    @decorateSuite(t.config, {only: true}) class ShouldRun extends CountingTestSuite {}
    @decorateSubSuite(t.config, ShouldRun, {skip: true}) class SkippedSub extends CountingTestSuite {
      @decorateTest(t.config) 'should not run'(t) { t.expect(true).to.equal(false) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SkippedFromOnly'),
      this.suiteReport('ShouldRun')
    ])
    t.expect(suiteHookRuns).to.deep.equal([
      'ShouldRun setup', 'ShouldRun teardown',
    ])
  }

  @Test() async 'run static onDecorate hook'(t) {
    let didOnDecorateRun = false 
    @decorateSuite(t.config) class WithOnDecorate extends TestSuite {
      static onDecorate() {
        didOnDecorateRun = true
      }
    }
    await this.runSuite()
    t.expect(didOnDecorateRun).to.equal(true)
  }
}
