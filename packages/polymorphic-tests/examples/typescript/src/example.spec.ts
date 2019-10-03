import {TestSuite, Suite, Test} from 'polymorphic-tests'
import {add} from './example'

@Suite()
class ExampleSuite extends TestSuite {
  @Test({only: true}) 'passing test'(t) {
    t.expect(add(1, 1)).to.equal(2)
  }

  @Test({only: true, skip: true}) 'skipped test'(t) {
    t.expect(add(1, 1)).to.equal(3)
  }

  @Test() 'skipped because not only'(t) {
    t.expect(add(1, 1)).to.equal(3)
  }

  @Test({only: true}) 'failing test'(t) {
    t.expect(add(1, 1)).to.equal(3)
  }
}