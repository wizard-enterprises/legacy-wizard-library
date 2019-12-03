import { customElement, property, query, html } from 'lit-element'
import { CachedReturn } from 'wizard-decorators'
import { PipeComponent } from '../../abstract/pipe-component'
import 'json-form-custom-element'

@customElement('wizard-pipe-form')
export class WizardPipeForm<inputT = any, outputT = inputT> extends PipeComponent<inputT, outputT> {
  @property() schema = {}
  @property() config = {}
  @query('json-form') protected jsonForm
  private lastFormChangeEvent

  async firstUpdated(props) {
    await super.firstUpdated(props)
    this.addEventListener('keyup', ev => {
      if (ev.keyCode === 13) // enter
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

  shouldUpdate() {
    return Boolean(
      super.shouldUpdate()
        && this.schema && this.config
    )
  }

  render() {
    let [schema, config] = [this.schema, this.config].map(p => this.parseJsonFormParam(p)),
      input = this.parseInput()
     return html`
      <json-form schema=${schema} config=${config} value=${input || '{}'}></json-form>
      <button id="submit" @click=${this.trySubmit}>Submit</button>
    `
  }

  private parseInput(input = this.input) {
    try {
      return JSON.stringify(input)
    } catch (e) {
      throw new Error(`wizard-pipe-form input is not JSON stringifiable: ${input}`)
    }
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
    let output = this.lastFormChangeEvent.value as outputT
    await this.pipeOut(output)
  }
}