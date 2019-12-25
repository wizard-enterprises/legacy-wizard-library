import { LitElement, html, customElement, property } from 'lit-element'

@customElement('test-element')
export class TestElement extends LitElement {
  @property() arg
  defaultArg = 'default'

  render() {
    return html`
      <h1>Test Element</h1>
      <h2>(with arg: ${this.makeArg()})</h2>
    `
  }

  makeArg() {
    return this.arg || this.defaultArg
  }
}