import { Suite, SubSuite, Test, TestSuite } from "../lib/public-api"
import { RawTestRunnerSuite } from "./test-runner-suite"
import { decorateSuite, decorateTest, decorateSubSuite } from "../lib/public-api/decorators"
import { TestEntityStatus as Status } from "../lib/core/abstract-test-entity"

@Suite() class TestSelection extends RawTestRunnerSuite {}
@SubSuite(TestSelection) class Skip extends RawTestRunnerSuite {
  @Test() async 'skip test'(t) {
    @decorateSuite(t.config) class SkipSuite extends TestSuite {
      @decorateTest(t.config) 'should run'(t) { makePassingExpectation(t) }
      @decorateTest(t.config, {skip: true}) 'should be skipped'(t) { makeFailingExpectation(t) }
      @decorateTest(t.config) 'should also run'(t) { makePassingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SkipSuite', {children: [
        this.testReport('SkipSuite: should run'),
        this.testReport('SkipSuite: should be skipped', Status.skipped),
        this.testReport('SkipSuite: should also run'),
      ]})
    ])
  }

  @Test() async 'skipped test should have end'(t) {
    @decorateSuite(t.config, {skip: true}) class Skip extends TestSuite {
      @decorateTest(t.config) 'should be skipped'(t) { makeFailingExpectation(t) }
    }
    let report
    t.expect(report = await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('Skip', {children: [
        this.testReport('Skip: should be skipped', Status.skipped),
      ]}),
    ])
    t.expect(report[0].end).to.be.an.instanceof(Date)
    t.expect(report[0].children[0].end).to.be.an.instanceof(Date)
  }

  @Test() async 'run global with all skipped'(t) {
    @decorateSuite(t.config, {skip: true}) class EmptySuite extends TestSuite {}
    @decorateSuite(t.config) class ParentSuite extends TestSuite {}
    @decorateSubSuite(t.config, ParentSuite, {skip: true}) class EmptyChildSuite extends TestSuite {}
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('EmptySuite'),
      this.suiteReport('ParentSuite', {children: [
        this.suiteReport('ParentSuite_EmptyChildSuite'),
      ]}),
    ])
  }

  @Test() async 'skip suite'(t) {
    @decorateSuite(t.config) class ShouldRunSuite extends TestSuite {
      @decorateTest(t.config) 'should run'(t) { makePassingExpectation(t) }
      @decorateTest(t.config, {skip: true}) 'should be skipped'(t) { makeFailingExpectation(t) }
    }
    @decorateSuite(t.config, {skip: true}) class ShouldBeSkippedSuite extends TestSuite {
      @decorateTest(t.config) 'should be skipped'(t) { makeFailingExpectation(t) }
      @decorateTest(t.config, {skip: true}) 'should also be skipped'(t) { makeFailingExpectation(t) }
    }
    @decorateSubSuite(t.config, ShouldBeSkippedSuite) class ShouldBeSkippedSubSuite extends TestSuite {
      @decorateTest(t.config) 'should be skipped because of parent'(t) { makeFailingExpectation(t) }
    }
    @decorateSubSuite(t.config, ShouldBeSkippedSubSuite) class ShouldBeSkippedSubSubSuite extends TestSuite {
      @decorateTest(t.config) 'should be skipped because of grandparent'(t) { makeFailingExpectation(t) }
    }
    @decorateSuite(t.config) class ShouldAlsoRunSuite extends TestSuite {
      @decorateTest(t.config) 'should run'(t) { makePassingExpectation(t) }
      @decorateTest(t.config, {skip: true}) 'should be skipped'(t) { makeFailingExpectation(t) }
    }
    let skippedSuite = 'ShouldBeSkippedSuite',
      skippedSubSuite = `${skippedSuite}_ShouldBeSkippedSubSuite`,
      skippedSubSubSuite = `${skippedSubSuite}_ShouldBeSkippedSubSubSuite`
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ShouldRunSuite', {children: [
        this.testReport('ShouldRunSuite: should run'),
        this.testReport('ShouldRunSuite: should be skipped', Status.skipped),
      ]}),
      this.suiteReport(skippedSuite, {children: [
        this.testReport(`${skippedSuite}: should be skipped`, Status.skipped),
        this.testReport(`${skippedSuite}: should also be skipped`, Status.skipped),
        this.suiteReport(skippedSubSuite, {children: [
          this.testReport(`${skippedSubSuite}: should be skipped because of parent`, Status.skipped),
          this.suiteReport(skippedSubSubSuite, {children: [
            this.testReport(`${skippedSubSubSuite}: should be skipped because of grandparent`, Status.skipped)
          ]}),
        ]}),
      ]}),
      this.suiteReport('ShouldAlsoRunSuite', {children: [
        this.testReport('ShouldAlsoRunSuite: should run'),
        this.testReport('ShouldAlsoRunSuite: should be skipped', Status.skipped),
      ]}),
    ])
  }

}

@SubSuite(TestSelection) class Only extends RawTestRunnerSuite {
  @Test() async 'run only test'(t) {
    @decorateSuite(t.config) class PlainSuite extends TestSuite {
      @decorateTest(t.config) 'should not run'(t) { makeFailingExpectation(t) }
      @decorateTest(t.config, {only: true}) 'should run'(t) { makePassingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('PlainSuite', {children: [
        this.testReport('PlainSuite: should not run', Status.skipped),
        this.testReport('PlainSuite: should run'),
      ]}),
    ])
  }

  @Test() async 'run only suite'(t) {
    @decorateSuite(t.config, {only: true}) class SuiteWithOnly extends TestSuite {
      @decorateTest(t.config) 'should run'(t) { makePassingExpectation(t) }
    }
    @decorateSuite(t.config) class PlainSuite extends TestSuite {
      @decorateTest(t.config) 'should not run'(t) { makeFailingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SuiteWithOnly', {children: [
        this.testReport('SuiteWithOnly: should run'),
      ]}),
      this.suiteReport('PlainSuite', {children: [
        this.testReport('PlainSuite: should not run', Status.skipped),
      ]}),
    ])
  }

  @Test() async 'apply only exclusively inside one test entity level'(t) {
    @decorateSuite(t.config) class PlainSuite extends TestSuite {
      @decorateTest(t.config) 'should not run'(t) { makeFailingExpectation(t) }
    }
    @decorateSuite(t.config, {only: true}) class SuiteWithOnly extends TestSuite {
      @decorateTest(t.config) 'should run'(t) { makePassingExpectation(t) }
    }
    @decorateSubSuite(t.config, SuiteWithOnly) class PlainSuiteInOnly extends TestSuite {
      @decorateTest(t.config) 'should not run because of subsuite with only'(t) { makeFailingExpectation(t) }
    }
    @decorateSubSuite(t.config, PlainSuiteInOnly) class SubSuiteWithoutOnly extends TestSuite {
      @decorateTest(t.config) 'should not run because of subsuite with only'(t) { makeFailingExpectation(t) }
    }
    @decorateSubSuite(t.config, PlainSuiteInOnly, {only: true}) class SubSuiteWithOnly extends TestSuite {
      @decorateTest(t.config) 'should run'(t) { makePassingExpectation(t) }
    }
    let onlyId = 'SuiteWithOnly',
      plainInOnlyId = `${onlyId}_PlainSuiteInOnly`
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('PlainSuite', {children: [
        this.testReport('PlainSuite: should not run', Status.skipped),
      ]}),
      this.suiteReport(onlyId, {children: [
        this.testReport(`${onlyId}: should run`),
        this.suiteReport(plainInOnlyId, {children: [
          this.testReport(`${plainInOnlyId}: should not run because of subsuite with only`, Status.skipped),
          this.suiteReport(`${plainInOnlyId}_SubSuiteWithoutOnly`, {children: [
            this.testReport(`${plainInOnlyId}_SubSuiteWithoutOnly: should not run because of subsuite with only`, Status.skipped),
          ]}),
          this.suiteReport(`${plainInOnlyId}_SubSuiteWithOnly`, {children: [
            this.testReport(`${plainInOnlyId}_SubSuiteWithOnly: should run`)
          ]}),
        ]}),
      ]}),
    ])
  }
}

@SubSuite(TestSelection) class SkipAndOnly extends RawTestRunnerSuite {
  @Test() async 'skip should take precedence over only on test'(t) {
    @decorateSuite(t.config) class SkipOverOnly extends TestSuite {
      @decorateTest(t.config, {only: true, skip: true}) 'only and skip should not run'(t) { makeFailingExpectation(t) }
      @decorateTest(t.config) 'should not run because of only'(t) { makeFailingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('SkipOverOnly', {children: [
        this.testReport('SkipOverOnly: only and skip should not run', Status.skipped),
        this.testReport('SkipOverOnly: should not run because of only', Status.skipped),
      ]}),
    ])
  }

  @Test() async 'skipped suite should not run subentities with only'(t) {
    @decorateSuite(t.config) class ShouldRun extends TestSuite {
      @decorateTest(t.config, {only: true}) 'should run'(t) { makePassingExpectation(t) }
    }
    @decorateSuite(t.config, {skip: true}) class SkipOverOnly extends TestSuite {
      @decorateTest(t.config, {only: true}) 'should not run because of skip'(t) { makeFailingExpectation(t) }
      @decorateTest(t.config) 'should also not run'(t) { makeFailingExpectation(t) }
    }
    @decorateSubSuite(t.config, SkipOverOnly) class SkippedSubSuite extends TestSuite {
      @decorateTest(t.config, {only: true}) 'should not run because of skip'(t) { makeFailingExpectation(t) }
      @decorateTest(t.config) 'should also not run'(t) { makeFailingExpectation(t) }
    }
    t.expect(await this.runSuiteAndGetReport()).to.shallowDeepEqual([
      this.suiteReport('ShouldRun', {children: [
        this.testReport('ShouldRun: should run'),
      ]}),
      this.suiteReport('SkipOverOnly', {children: [
        this.testReport('SkipOverOnly: should not run because of skip', Status.skipped),
        this.testReport('SkipOverOnly: should also not run', Status.skipped),
        this.suiteReport('SkipOverOnly_SkippedSubSuite', {children: [
          this.testReport('SkipOverOnly_SkippedSubSuite: should not run because of skip', Status.skipped),
          this.testReport('SkipOverOnly_SkippedSubSuite: should also not run', Status.skipped),
        ]}),
      ]}),
    ])
  }
}

function makePassingExpectation (t) {
  t.expect(true).to.equal(true)
}
function makeFailingExpectation (t) {
  t.expect(true).to.equal(false)
}