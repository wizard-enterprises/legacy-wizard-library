import { customElement, html, property, query } from 'lit-element'
import { WizardElement } from '../wizard-element'

export enum AddTo {
  start = 'start',
  end = 'end',
}

@customElement('wizard-expanding-list') export class ExpandingList extends WizardElement {
  @property({type: Array}) items = []
  @property({type: AddTo, noAccessor: true}) addTo = AddTo.end
  @property({type: AddTo}) inputAt = AddTo.start
  @query('#input') inputElement

  public add(item: string) {
    this.items = this.addTo === AddTo.start
      ? [item, ...this.items]
      : [...this.items, item]
  }

  render() {
    return html`
      ${this.inputAt === AddTo.start ? this.renderInput() : ''}
      <ul id="list">
        ${this.items.map(item => html`
          <li>${item}</li>
        `)}
      </ul>
      ${this.inputAt === AddTo.end ? this.renderInput() : ''}
    `
  }

  renderInput() {
    return html`
      <input id="input" @keyup=${this.inputKeyup}></input>
      <button id="add-button" @click=${this.addClicked}>Add</button>
    `
  }

  protected inputKeyup(e) {
    if (e.key === 'Enter')
      this.addFromInput()
  }

  protected addClicked() {
    this.addFromInput()
  }

  private addFromInput() {
    let item = this.inputElement.value.trim()
    this.inputElement.value = ''
    this.add(item)
  }
}