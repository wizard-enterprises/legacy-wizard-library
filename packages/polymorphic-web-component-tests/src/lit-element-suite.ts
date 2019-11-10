import { HookWaitingWebComponentSuite } from './hook-waiting-web-component-suite'

export abstract class LitElementSuite extends HookWaitingWebComponentSuite {
  protected get hookMethodAndPromiseNames() {
    return this.makeHookMap(
      this.hook('firstUpdated', {andThen: 
        this.promise('updateComplete'),
      }),
    )
  }
}

export abstract class VaadinRouteSuite extends LitElementSuite {
  protected errorEvents = ['vaadin-router-error']
  protected get hookMethodAndPromiseNames() {
    return super.hookMethodAndPromiseNames
      .set(...this.event('vaadin-router-location-changed', {ignoreErrors: true}))
  }
}