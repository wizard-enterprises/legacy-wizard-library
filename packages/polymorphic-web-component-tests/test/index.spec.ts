import { LitElementSuite } from '../src/lit-element-suite'
import path from 'path'

export abstract class TestComponentSuite extends LitElementSuite {
  static componentPath = require.resolve('./test-web-component')
  static componentTag = 'test-element'
}