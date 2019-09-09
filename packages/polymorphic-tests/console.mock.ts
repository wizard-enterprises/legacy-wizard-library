export enum ConsoleCallType {
  log, warning, error,
}

interface SpyCall<argsT = any[]> extends Object {
  args: argsT,
  timestamp: number,
}

interface PrivateSpyCalls<T extends SpyCall, argsT = any[]> extends SpyCalls<T, argsT> {
  registerCall(args: argsT[], additional: Partial<T>)
}

interface SpyCalls<T extends SpyCall, argsT = any[]> {
  (): T[],
  args: () => argsT[]
}

function makeSpyCalls<T extends SpyCall>(rawCalls: T[]) {
  let SpyCalls = function() {
    return rawCalls
  } as PrivateSpyCalls<T>
  SpyCalls.args = () => rawCalls.map(call => call.args)
  SpyCalls.registerCall = (args: T['args'], additional: Partial<T>) =>
    rawCalls.push({...<Object>additional, args, timestamp: Date.now()} as T)
  return SpyCalls
}

interface ConsoleSpyCall extends SpyCall {
  type: ConsoleCallType
}

export interface Console {
  log(...toLog): void
  warn(...toLog): void
  error(...toLog): void
}

export class ConsoleSpy implements Console {
  private _calls = []
  private privateCalls = makeSpyCalls<ConsoleSpyCall>(this._calls)
  public calls = this.privateCalls as SpyCalls<ConsoleSpyCall>

  log(...toLog) {
    this.registerCall(ConsoleCallType.log, toLog)
  }
  
  warn(...toLog) {
    this.registerCall(ConsoleCallType.warning, toLog)
  }
  
  error(...toLog) {
    this.registerCall(ConsoleCallType.error, toLog)
  }
  
  private registerCall(type, args) {
    this.privateCalls.registerCall(args, {type})
  }
}

export function getEnvironmentalConsole() {
  if (this.window) return this.window.console 
  //@ts-ignore
  if (this.global) return this.global.console
  if (this.console) return this.console
  //@ts-ignore
  if (console) return console
}
