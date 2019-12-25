import { WebComponentSuite } from "./web-component-suite"

export enum WaitableType {
  hook = 'hook',
  promise = 'promise',
  event = 'event'
}

export type WaitingHookDefinition<T extends WaitableType> = [
  string,
  WaitingHookDefinitionOpts<T>,
]

export type WaitingHookDefinitionOpts<T extends WaitableType> = {
  type: T
  ignoreErrors?: boolean
  andThen?: WaitingHookDefinition<WaitableType>
}

export type WaitingHookDefinitionHelper<T extends WaitableType> =
  (name: string, opts?: Partial<WaitingHookDefinitionOpts<T>>) => WaitingHookDefinition<T>


function makeWaitingHookDefinitionHelper<T extends WaitableType>(type: T): WaitingHookDefinitionHelper<T> {
  return ((name, opts = {type}) => [name, {type, ...opts}]) as WaitingHookDefinitionHelper<T>
}

export abstract class HookWaitingWebComponentSuite extends WebComponentSuite {
  protected hook = makeWaitingHookDefinitionHelper<WaitableType.hook>(WaitableType.hook)
  protected promise = makeWaitingHookDefinitionHelper<WaitableType.promise>(WaitableType.promise)
  protected event = makeWaitingHookDefinitionHelper<WaitableType.event>(WaitableType.event)
  protected makeHookMap(...hooks: Array<[string, WaitingHookDefinitionOpts<WaitableType>]>) {
    return new Map(hooks)
  }
  protected abstract hookMethodAndPromiseNames: Map<string, WaitingHookDefinitionOpts<WaitableType>>
  protected getWaitFuncArgs() {
    return [Array.from(this.hookMethodAndPromiseNames)]
  }

  protected async waitForReady(element, hookMethodAndPromiseNames) {
    let makePromise = (name, type, opts) => new Promise((resolve, reject) => {
      switch (type) {
        case 'promise':
          if ((element[name] instanceof Promise) === false)
            reject(new Error(`element[${name}] is not a promise: ${element[name]}`))
          else 
            element[name].then(resolve).catch(reject)
          break
        case 'event': {
          try {
            let listener = (ev) => {
              window.removeEventListener(name, listener)
              ;(ev.error && opts.ignoreErrors !== true) ? reject(ev) : resolve(ev)
            }
            window.addEventListener(name, listener)
          } catch (e) {
            if (opts.ignoreErrors !== true) throw e
          }
          break
        }
        case 'hook': {
          if (element[name] !== undefined && element[name] instanceof Function === false)
            return reject(new Error(`element[${name}] exists but is not a function: ${element[name]}`))
          let original = element[name] && element[name].bind(element)
          element[name] = async (...args) => {
            try {
              if (original) {
                let ret = original(...args)
                if (ret instanceof Promise)
                  return ret.then(resolve).catch(reject)
                else resolve(ret)
              } else
                resolve()
            } catch (e) {
              if (opts.ignoreErrors !== true) reject(e)
              window['error']('ignored error', e)
            }
          }
          break
        }
      }
    })
    await Promise.all(hookMethodAndPromiseNames.map(([name, opts]) =>
      makePromise(name, opts.type, opts)
        .then(res => opts.andThen
          ? makePromise(opts.andThen[0], opts.andThen[1].type, opts.andThen[1])
          : Promise.resolve(res)
        )
    )).catch(e => {
      throw window['utils'].makeWindowErrorSerializable(e)
    })
    
  }
}