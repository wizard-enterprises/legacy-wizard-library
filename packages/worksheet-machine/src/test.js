import { LitElement, html, customElement, property } from 'lit-element'
import { map } from 'rxjs/operators'
import { WizardElement } from './abstract/element'

@customElement('test-element')
export class TestElement extends WizardElement {
  @property() arg
  @property({attribute: false}) pathname
  defaultArg = 'default'

  constructor() {
    super()
  }

  firstUpdated() {
    this.globalEvents.location.pipe(
      map(location => location.pathname.replace('/', '')),
    ).subscribe(pathname =>
      this.pathname = pathname)
  }

  render() {
    return html`
      <h1>Test Element</h1>
      <h2>(with arg: ${this.arg || this.pathname || this.defaultArg})
      <br>
    `
  }
}