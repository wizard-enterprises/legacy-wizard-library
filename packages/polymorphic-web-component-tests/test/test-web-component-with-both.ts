import { LitElement, html, customElement, property } from 'lit-element'

@customElement('test-element-with-both')
export class TestElement extends LitElement {
  @property() arg
  defaultArg = 'default'

  render() {
    return html`
      <test-element></test-element>
      <test-element-2></test-element-2>
    `
  }

  makeArg() {
    return this.arg || this.defaultArg
  }
}