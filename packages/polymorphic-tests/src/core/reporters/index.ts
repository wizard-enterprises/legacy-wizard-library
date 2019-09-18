import {SimpleTestReporter} from './simple'
import {TestReporter} from '../test-reporter'

export enum TestReporterType {
  simple = 'simple',
}

export function getReporterOfType(type: TestReporterType) {
  switch (type) {
    case TestReporterType.simple:
      return SimpleTestReporter
  }
}