import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSubSuite, decorateSuite, decorateTest } from "../src/public-api/decorators";
import { RawTestRunningSuite } from './test-running-suite';
import { TestEntityStatus } from "../src/core/abstract-test-entity";

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

  @Test() async 'should inherit tests from abstract test suite'(t) {
    let config = this.decoratorConfig
    abstract class AbstractSuite extends TestSuite {
      static counter = 1
      abstract expectedCounter: number
      after() {
        AbstractSuite.counter++
      }
      @decorateTest(config) 'counter should match subclass'(t) {
        t.expect(AbstractSuite.counter).to.equal(this.expectedCounter)
      }
    }
    @decorateSuite(config) class SomeSuite extends TestSuite {
      @decorateTest(config) 'first test'(t) { t.expect(true).to.equal(true) }
    }
    @decorateSubSuite(config, SomeSuite) class ChildOfAbstractSuite extends AbstractSuite {
      expectedCounter = 1
    }
    @decorateSuite(config) class SomeChildSuite extends AbstractSuite {
      expectedCounter = 2
    }
    @decorateSubSuite(config, SomeChildSuite) class SomeChildSubSuite extends AbstractSuite {
      expectedCounter = 3
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SomeSuite', {children: [
        this.testReport('SomeSuite: first test'),
        this.suiteReport('SomeSuite_ChildOfAbstractSuite', {children: [
          this.testReport('SomeSuite_ChildOfAbstractSuite: counter should match subclass'),
        ]}),
      ]}),
      this.suiteReport('SomeChildSuite', {children: [
        this.testReport('SomeChildSuite: counter should match subclass'),
        this.suiteReport('SomeChildSuite_SomeChildSubSuite', {children: [
          this.testReport('SomeChildSuite_SomeChildSubSuite: counter should match subclass'),
        ]}),
      ]}),
    ])
  }

  @Test() async 'run inherited tests from abstract to specific'(t) {
    let config = this.decoratorConfig
    abstract class GrandparentSuite extends TestSuite {
      @decorateTest(config) 'grandparent test'(t) { t.expect(true).to.equal(true) }
    }
    abstract class ParentSuite extends GrandparentSuite {
      @decorateTest(config) 'parent test'(t) { t.expect(true).to.equal(true) }
    }
    @decorateSuite(config) class ChildSuite extends ParentSuite {
      @decorateTest(config) 'child test'(t) { t.expect(true).to.equal(true) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ChildSuite', {children: [
        this.testReport('ChildSuite: grandparent test'),
        this.testReport('ChildSuite: parent test'),
        this.testReport('ChildSuite: child test'),
      ]}),
    ])
  }

  @Test() async 'ignore tests without only when inheriting tests with only'(t) {
    let config = this.decoratorConfig
    abstract class ParentSuite extends TestSuite {
      @decorateTest(config, {only: true}) 'should run from parent'(t) { t.expect(true).to.equal(true) }
      @decorateTest(config) 'should be skipped from parent'(t) { t.expect(true).to.equal(false) }
    }
    @decorateSuite(config) class ChildSuite extends ParentSuite {
      @decorateTest(config) 'should be skipped in child'(t) { t.expect(true).to.equal(false) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ChildSuite', {children: [
        this.testReport('ChildSuite: should run from parent'),
        this.testReport('ChildSuite: should be skipped from parent', TestEntityStatus.skipped),
        this.testReport('ChildSuite: should be skipped in child', TestEntityStatus.skipped),
      ]}),
    ])
  }
}
