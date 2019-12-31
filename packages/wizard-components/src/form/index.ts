import 'formiojs/dist/formio.full.min.js'
import 'choices.js/public/assets/scripts/choices.min'
import { FormBuilder, Formio } from 'formiojs'
import { customElement, property } from 'lit-element'
import { CachedReturn } from 'wizard-decorators'
import { WizardElement } from '../wizard-element'

@customElement('wizard-form')
export class WizardForm<inputT = any, outputT = inputT> extends WizardElement {
  @property() schema
  @property() config: any = {}
  @property() value?: inputT
  public form

  createRenderRoot() {
    return this
  }

  async _getUpdateComplete() {
    await super._getUpdateComplete()
    await this.makeForm()
  }
  
  @CachedReturn async makeForm() {
    if (!this.schema) {
      this.form = new FormBuilder(this, {}, this.config)
      await this.form.ready
    } else {
      //@ts-ignore
      let value = this.value === `${this.value}` ? JSON.parse(this.value) : this.value
      let submission = { data: value instanceof Object ? value : {value} }
      this.form = await Formio.createForm(this, this.schema || {}, this.config)
      this.form.submission = submission
      await this.form.render()
    }
    return this.form
  }

  shouldUpdate(props) {
    return Boolean(
      super.shouldUpdate(props)
        && this.schema && this.config
    )
  }
}