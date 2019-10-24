import { html, property, customElement, LitElement, query } from 'lit-element'
import { Router } from '@vaadin/router'

@customElement('wizard-spa') export class WizardSpa extends LitElement {
  _routes
  @property() get routes() { return this._routes }
  set routes(routes) {
    try { this._routes = JSON.parse(routes) }
    catch (e) { throw new Error(`Routes are not valid JSON: ${routes}`) }
  }
  @query('#root') rootElement

  // render() {
  //   return html`
  //     <main id="root"><h1>Test</h1></main>
  //   `
  // }

  createRenderRoot() {
    return this
  }

  async firstUpdated(props) {
    // super.firstUpdated(props)
    // if (!this.rootElement) debugger
    this.router = new Router(this)
    this.router.setRoutes(this.routes)
  }
}