import {SimpleTestReporter} from './simple'
import {TapReporter} from './tap'

export enum TestReporterType {
  simple = 'simple',
  tap = 'tap',
  raw = 'raw',
}

export function getReporterOfType(type: TestReporterType) {
  switch (type) {
    case TestReporterType.simple:
      return SimpleTestReporter
    case TestReporterType.tap:
      return TapReporter
  }
}