import { customElement, property, query, html, LitElement } from 'lit-element'
import { CachedReturn } from 'wizard-decorators'
import 'json-form-custom-element'

@customElement('wizard-form')
export class WizardPipeForm<inputT = any, outputT = inputT> extends LitElement {
  @property() schema = {}
  @property() config = {}
  @property() value?: inputT
  @query('json-form') protected jsonForm
  private lastFormChangeEvent

  async firstUpdated(props) {
    await super.firstUpdated(props)
    this.addEventListener('keyup', ev => {
      if (ev.key === 'Enter')
        this.trySubmit()
    })
  }

  async update(props) {
    await super.update(props)
    if (this.jsonForm) this.addFormChangeListener()
  }
  
  @CachedReturn addFormChangeListener() {
    this.jsonForm.addEventListener('change', ev => this.lastFormChangeEvent = ev.detail)
  }

  shouldUpdate(props) {
    return Boolean(
      super.shouldUpdate(props)
        && this.schema && this.config
    )
  }

  render() {
    let [schema, config] = [this.schema, this.config].map(p => this.parseJsonFormParam(p))
    return html`
      <json-form schema=${schema} config=${config} value=${this.value || '{}'}></json-form>
      <button id="submit" @click=${this.trySubmit}>Submit</button>
    `
  }

  private parseJsonFormParam(param) {
    try {
      return (param === `${param}`) ? param : JSON.stringify(param)
    } catch (e) {
      return '{}'
    }
  }

  protected async trySubmit() {
    if (this.lastFormChangeEvent.isValid === false)
      return console.error('Submit failed because form is invalid', this.lastFormChangeEvent.errors)
    let output = this.lastFormChangeEvent.value
    await this.dispatchEvent(new CustomEvent('submit', {detail: output}))
  }
}