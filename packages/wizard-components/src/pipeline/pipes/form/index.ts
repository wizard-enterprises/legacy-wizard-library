import { customElement, property, query, html } from 'lit-element'
import { CachedReturn } from 'wizard-decorators'
import { PipeComponent } from '../../abstract/pipe-component'
import '../../../form'

@customElement('wizard-pipe-form')
export class WizardPipeForm<inputT = any, outputT = inputT> extends PipeComponent<inputT, outputT> {
  @property() schema = {}
  @property() config = {}
  @query('wizard-form') protected wizardForm

  async update(props) {
    await super.update(props)
    if (this.wizardForm) this.addFormSubmitListener()
  }
  
  @CachedReturn addFormSubmitListener() {
    this.wizardForm.addEventListener('submit', ev => this.pipeOut(ev.detail))
  }

  shouldUpdate() {
    return Boolean(
      super.shouldUpdate()
        && this.schema && this.config
    )
  }

  render() {
    return html`
      <wizard-form .schema=${this.schema} .config=${this.config} value=${this.input || '{}'}></json-form>
    `
  }
}