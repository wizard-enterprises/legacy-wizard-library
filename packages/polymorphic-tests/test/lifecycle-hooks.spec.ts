import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../src/public-api/decorators";
import { RawTestRunnerSuite } from './test-runner-suite';

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
