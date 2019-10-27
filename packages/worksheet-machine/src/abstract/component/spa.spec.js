import { WizardSpa } from './spa'
import { Suite, Test, TestSuite } from 'polymorphic-tests'

@Suite() class SpaTest extends TestSuite {
  @Test() 'test'(t) {
    let spa = new WizardSpa
    t.expect(spa).to.equal(spa.createRenderRoot())
  }
}