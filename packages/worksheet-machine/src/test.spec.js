import {Suite, Test, TestSuite} from 'polymorphic-tests'

@Suite()
class Example extends TestSuite {
  @Test() 'this is a test'(t) {
    t.expect(true).to.equal(false)
  }
}