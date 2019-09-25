import { Suite, Test, TestSuite } from "../src/public-api";
import { decorateSuite, decorateTest, decorateSubSuite } from "../src/public-api/decorators";
import { TestRunningSuite } from "./test-running-suite";
import { TestEntityType as Type, TestEntityStatus as Status } from "../src/core/abstract-test-entity";

@Suite() class PlainTests extends TestRunningSuite {
  @Test() async 'run empty suite'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class EmptySuite extends TestSuite {}
    await this.runSuite()
    let report = this.reporter['makeEndReport']()
    t.assert.objectMatches(report, [{
      id: 'EmptySuite',
      type: Type.suite,
      status: Status.passed,
    }])
    t.assert.identical(report.length, 1)
  }

  @Test() async 'run suite with subsuite with empty tests'(t) {
    let config = this.decoratorConfig
    @decorateSuite(config) class ParentSuite extends TestSuite {
      @decorateTest(config) test() {}
    }
    @decorateSubSuite(config, ParentSuite) class ChildSuite extends TestSuite {
      @decorateTest(config) test() {}
    }
    await this.runSuite()
    let report = this.reporter['makeEndReport']()
    t.assert.objectMatches(report, [{
      id: 'ParentSuite',
      type: Type.suite,
      status: Status.passed,
      children: [
        {
          id: 'ParentSuite: test',
          type: Type.test,
          status: Status.passed,
        },
        {
          id: 'ParentSuite_ChildSuite',
          type: Type.suite,
          status: Status.passed,
          children: [{
            id: 'ParentSuite_ChildSuite: test',
            type: Type.test,
            status: Status.passed,
          }],
        },
      ],
    }])
  }
}