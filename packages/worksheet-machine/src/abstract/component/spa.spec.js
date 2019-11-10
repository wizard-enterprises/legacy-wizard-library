import { Suite, Test } from 'polymorphic-tests'
import { VaadinRouteSuite } from 'polymorphic-web-component-tests'
import path from 'path'

@Suite() class SpaTest extends VaadinRouteSuite {
  static componentPath = path.resolve(__dirname, 'spa.js')
  static componentTag = 'wizard-spa'

  @Test() async 'test'(t) {
    t.expect(await t.eval('element.id')).to.equal('component')
    t.expect(await t.eval('element === element.createRenderRoot()')).to.equal(true)
    // process.exit()
  }
}