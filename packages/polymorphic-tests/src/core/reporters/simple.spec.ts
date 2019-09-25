import { ReporterTestSuite } from "./reporter.spec";
import { TestReporterType } from "."
import { Suite, assert } from "../../public-api";

// @Suite() class SimpleReporterSuite extends ReporterTestSuite {
//   protected type = TestReporterType.simple

//   protected validateBasicSuiteReport(t, report) {
//     t.assert.primitiveEqual(
//       report.lines,
//       [
//         'Running tests...',
//         'Test "fail" failed:\nError: Expected "false" to be truthy',
//         'Run failed, 1 failed, 1/4 passed.',
//       ],
//     )
//   }
// }