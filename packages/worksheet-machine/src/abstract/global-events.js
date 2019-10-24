import { CachedReturn } from './decorators'
import { fromEvent } from 'rxjs'
import { map, tap } from 'rxjs/operators'

@CachedReturn export class GlobalEvents {
  constructor() {
    this.location = fromEvent(window, 'popstate').pipe(
      tap(e => console.log('fromEvent popstate', e)),
      map(e => window.location),
      tap(location => console.log('fromEvent popstate post map', location)),
    )
  }
}