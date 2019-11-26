import { LitElement, html, customElement, property } from 'lit-element'
import './test-web-component'
import './test-web-component-2'

@customElement('test-element-with-both')
export class TestElementWithBoth extends LitElement {
  render() {
    return html`
      <test-element></test-element>
      <test-element-2></test-element-2>
    `
  }
}