import { LitElement, html, customElement, property } from 'lit-element'

@customElement('test-element')
export class TestElement extends LitElement {
  @property() arg  = 'default'

  render() {
    return html`
      <h1>Test Element</h1>
      <h2>(with arg: ${this.arg})
      <br>
    `
  }
}