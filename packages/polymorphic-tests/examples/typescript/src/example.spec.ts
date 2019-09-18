import {TestSuite, Suite, Test, assert} from 'polymorphic-tests'
import {add} from './example'

@Suite()
class ExampleSuite extends TestSuite {
  @Test({only: true}) 'passing test'() {
    assert.identical(add(1, 1), 2)
  }

  @Test({only: true, skip: true}) 'skipped test'() {
    assert.identical(add(1, 1), 3)
  }

  @Test() 'skipped because not only'() {
    assert.identical(add(1, 1), 3)
  }

  @Test({only: true}) 'failing test'() {
    assert.identical(add(1, 1), 3)
  }
}