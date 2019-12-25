import 'formiojs/dist/formio.full.min.js'
import { customElement, property, LitElement } from 'lit-element'
import { CachedReturn } from 'wizard-decorators'
import { Formio, FormBuilder } from 'formiojs'

@customElement('wizard-form')
export class WizardForm<inputT = any, outputT = inputT> extends LitElement {
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
      this.form = await Formio.createForm(this, this.schema || {}, this.config)
      await this.form.build
      await this.form.ready
      //@ts-ignore
      let value = this.value === `${this.value}` ? JSON.parse(this.value) : this.value
      let submission = { data: value instanceof Object ? value : {value} }
      this.form.submission = submission
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