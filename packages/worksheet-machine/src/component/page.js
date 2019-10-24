import { customElement, LitElement } from 'lit-element'

@customElement('wizard-page')
export class WizardPage extends LitElement {
  get title() {
    return document.title
  }
  set title(title) {
    document.title = title
  }
}