import { customElement, property, query, html } from 'lit-element'
import { CachedReturn } from 'wizard-decorators'
import { PipeStatus } from 'wizard-patterns/lib/pipeline'
import { PipeComponent } from '../../abstract/pipe-component'
import 'wizard-form'

export const ONLY_DATA_VALUE = '_ONLY_DATA_VALUE_'

@customElement('wizard-pipe-form')
export class WizardPipeForm<inputT = any, outputT = inputT> extends PipeComponent<inputT, outputT> {
  @property({type: Object}) schema = {}
  @property({type: Object}) config = {}
  @query('wizard-form') protected wizardForm

  async update(props) {
    await super.update(props)
    if (this.wizardForm) this.addFormSubmitListener()
  }
  
  @CachedReturn async addFormSubmitListener() {
    await this.wizardForm.updateComplete
    //@ts-ignore
    this.wizardForm.form.on('submit', value => {
      let out = value.data
      delete out.submit
      if (out[ONLY_DATA_VALUE])
        out = out[ONLY_DATA_VALUE] 
      this.pipeOut(out)
    })
  }

  async _getUpdateComplete() {
    await super._getUpdateComplete()
    await this.wizardForm.updateComplete
  }

  shouldUpdate() {
    return Boolean(
      super.shouldUpdate()
        && this.schema && this.config && this.pipe.status === PipeStatus.piping
    )
  }

  render() {
    let input: any = this.input || undefined
    if (input !== undefined && input.constructor !== Object)
      input = {[ONLY_DATA_VALUE]: input}
    return html`
      <wizard-form
        .schema=${this.schema}
        .config=${this.config}
        .value=${input}
      ></wizard-form>
    `
  }
}