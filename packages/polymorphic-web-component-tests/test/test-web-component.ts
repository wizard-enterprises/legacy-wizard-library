import { LitElement, html, customElement, property } from 'lit-element'

@customElement('test-element')
export class TestElement extends LitElement {
  @property() arg
  defaultArg = 'default'

  constructor() {
    super()
    console.log('test-element ctor', this)
  }

  firstUpdated() {
    if (window['log']) window['log']('test-web-component firstUpdated called')
  }

  render() {
    console.log('rendering test-element')
    return html`
      <h1>Test Element</h1>
      <h2>(with arg: ${this.makeArg()})</h2>
    `
  }

  makeArg() {
    return this.arg || this.defaultArg
  }
}