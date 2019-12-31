import { LitElement } from 'lit-element'

export class WizardElement extends LitElement {
  protected shouldAdoptStyleSheetsFromParent: boolean = true

  connectedCallback() {
    super.connectedCallback()
    if (this.shouldAdoptStyleSheetsFromParent && this.shadowRoot) {
      let parentSheets = (this.parentNode['adoptedStyleSheets']
        ? this.parentNode
        : document)['adoptedStyleSheets']
      //@ts-ignore
      this.shadowRoot.adoptedStyleSheets = [...parentSheets, ...this.shadowRoot.adoptedStyleSheets]
    }
  }
}