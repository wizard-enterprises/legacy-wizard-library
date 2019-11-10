import { html, property, customElement, LitElement, query } from 'lit-element'
import { Router } from '@vaadin/router'
import { WizardElement } from '../element'

@customElement('wizard-spa') export class WizardSpa extends WizardElement {
  _routes
  @property() get routes() { return this._routes }
  set routes(routes) {
    try { this._routes = JSON.parse(routes) }
    catch (e) { this._routes = routes }
  }

  createRenderRoot() {
    return this
  }

  async firstUpdated(props) {
    this.router = new Router(this)
    await this.router.setRoutes(this.routes)
    await this.router.render()
    await this.router.ready
  }
}