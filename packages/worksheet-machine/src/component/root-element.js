import { LitElement, html, customElement, property } from 'lit-element'
import { WizardSpa } from '../abstract'

@customElement('worksheet-root')
export class Root extends WizardSpa {
  routes = [
    {path: "/", component: "test-element"},
    {path: "/dialogue", component: "test-element"},
    {path: "/print", component: "test-element"},
    {path: "/test", component: "test-page"},
    {path: "(.*)", redirect: "/"}
  ]
}