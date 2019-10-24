import { LitElement } from 'lit-element'
import { GlobalEvents } from './global-events'

export class WizardElement extends LitElement {
  globalEvents = GlobalEvents.getInstance()
}