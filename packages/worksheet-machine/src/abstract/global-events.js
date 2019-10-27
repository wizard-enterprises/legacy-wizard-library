import { CachedReturn } from './decorators'
import { BehaviorSubject, fromEvent } from 'rxjs'
import { map, tap } from 'rxjs/operators'

@CachedReturn export class GlobalEvents {
  @CachedReturn get location() {
    return getBehaviorSubjectFromEvent(window.location, window, 'popstate', () => window.location)
  }
}

function getBehaviorSubjectFromEvent(initValue, ...args) {
  return makeBehaviorSubjectFromObservable(fromEvent(...args), initValue)
}

function makeBehaviorSubjectFromObservable(obs, initValue) {
  let subject = new BehaviorSubject(initValue)
  obs.subscribe({
    complete: () => subject.complete(),
    error: x => subject.error(x),
    next: x => subject.next(x),
  })
  return subject
}