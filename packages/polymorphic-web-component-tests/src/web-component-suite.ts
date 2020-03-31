import { TestSuite } from 'polymorphic-tests'
import { CachedReturn } from 'wizard-decorators'
import { build } from './web-component-webpack-build'
import fs from 'fs'
import rimraf from 'rimraf'
import path from 'path'
import puppeteer, {EvaluateFn} from 'puppeteer'
import express, {Application} from 'express'
import { Subject } from 'rxjs'
import * as utils from 'wizard-utils/lib/browser/puppeteer'
import crypto from 'crypto'

type WindowErrorRegistration = string | [string, boolean]

export abstract class WebComponentSuite extends TestSuite {
  timeout = 10 * 1000
  static componentPath: string
  static componentTag: string
  protected readonly componentElementId = 'component'
  protected puppeteerOpts = {
    headless: true,
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      // '--disable-setuid-sandbox',
      // '--single-process',
      // '--no-zygote',
      // '--no-first-run',
    ]
  }
  protected errorEvents: WindowErrorRegistration[] = []

  private get tag() {
    //@ts-ignore
    return this.constructor.componentTag
  }

  protected browser: puppeteer.Browser
  protected page: puppeteer.Page
  protected component: puppeteer.JSHandle
  protected componentUrl: string
  private serverListener: ReturnType<Application['listen']>

  private static components: {[key: string]: string} = {}
  static onDecorate() {
    this.validateSuiteDefinition()
    this.validatePath()
    WebComponentSuite.components[this.componentTag] = this.componentPath
  }
  
  static validateSuiteDefinition() {
    let badDefinitionError = missing => new Error(`${this.name} not defined properly, missing \`${missing}\`.`)
    if (!this.componentPath) throw badDefinitionError('static componentPath = \'ABSOLUTE_PATH_TO_COMPONENT_FILE\'')
    if (!this.componentTag) throw badDefinitionError('static componentTag = \'custom-element\'')
  }

  private static supportedComponentFileExtensions = ['.ts', '.js']
  private static validatePath() {
    if (fs.existsSync(this.componentPath) === false)
      throw new Error(`Nonexistent web component file in ${this.constructor.name}: ${this.componentPath}`)
    let ext = path.extname(this.componentPath)
    if (this.supportedComponentFileExtensions.includes(ext) === false)
      throw new Error(`Unsupported web component file extension in ${this.constructor.name}.`)
    return true
  }

  async setup() {
    await super.setup()
    await this.buildForComponentHtmlFiles()
  }
  
  private teardownCount = 0
  async teardown() {
    if (++this.teardownCount === Object.keys(WebComponentSuite.components).length)
      await this.deleteTempBuild()
    await super.teardown()
  }

  private async getTempBuildDir() {
    return path.resolve(process.cwd(), 'web-component-temp-build/')
  }

  @CachedReturn
  private async buildForComponentHtmlFiles() {
    return build(await this.getTempBuildDir(), WebComponentSuite.components)
  }
  
  private deleteTempBuild() {
    return new Promise(async (resolve, reject) => rimraf(await this.getTempBuildDir(), e => e ? reject(e) : resolve()))
  }

  protected createComponentInPageSetup = true
  async before(t) {
    super.before(t)
    this.componentUrl = await this.setupComponentUrl()
    await this.setupEmptyPuppeteerPage(t)
    await this.setupPuppeteerPage(t)
  }

  async after(t) {
    await this.teardownPage()
    if (this.browser) await this.browser.close()
    if (this.serverListener) await new Promise((res, rej) =>
      this.serverListener.close(e => e ? rej(e) : res()))
    await super.after(t)
  }

  private async teardownPage() {
    if (this.component) await this.component.dispose()
    if (this.page) await this.page.close()
  }

  protected async refresh(t, url = this.componentUrl, shouldGotoUrl = true) {
    if (shouldGotoUrl) {
      await this.teardownPage()
      await this.setupNewPage()
    }
    await this.setupPuppeteerPage(t, url, shouldGotoUrl)
  }

  private async setupComponentUrl() {
    let app = express()
    app.use(express.static(await this.getTempBuildDir()))
    this.serverListener = app.listen()
    //@ts-ignore
    return `http://127.0.0.1:${this.serverListener.address().port}/${this.tag}.html`
  }

  private async setupEmptyPuppeteerPage(t) {
    this.browser = await puppeteer.launch(this.puppeteerOpts)
    await this.setupNewPage()
  }
  
  private async setupNewPage() {
    this.page = await this.browser.newPage()
    this.page.setBypassCSP(true)
    await this.page.setViewport({ width: 1920, height: 1080 })
    await this.page.setRequestInterception(true)
    this.page.on('request', req =>
      this.shouldAbortRequest(req)
        ? req.abort()
        : req.continue()
    )
  }

  protected shouldAbortRequest(req) {
    return [
      'stylesheet',
      'font',
      'image',
    ].includes(req.resourceType())
  }

  private async setupPuppeteerPage(t?, url = this.componentUrl, shouldGotoUrl = true) {
    if (shouldGotoUrl) {
      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
      })
      await this.page.exposeFunction('log', console.log)
      await this.page.exposeFunction('error', console.error)
    }
    await this.exposeUtilsOnPage(utils)
    if (this.createComponentInPageSetup)
      await this.createComponent(t)
  }

  private async exposeUtilsOnPage(utils) {
    utils = {...utils}
    await this.page.evaluate(async funcString => {
      window['utils'] = {
        makeFunctionFromStringified: new Function(`return (${funcString}).apply(window, arguments)`),
      }
    }, utils.makeFunctionFromStringified.toString())
    delete utils.makeFunctionFromStringified
    let utilStrings = Object.entries(utils).reduce((acc, [name, util]) =>
      ({...acc, [name]: util.toString()}), {})
    await this.page.evaluate(utilStrings => {
      for (let [name, utilString] of Object.entries(utilStrings))
        window['utils'][name] = window['utils'].makeFunctionFromStringified(utilString).bind(window['utils'])
    }, utilStrings)
  }

  protected initComponentArgs: any[] = []
  protected initComponent(element, ...initComponentArgs) {
    element.id = 'component'
  }

  protected async createComponent(t): Promise<puppeteer.ElementHandle> {
    await this.page.waitForFunction(`Boolean(customElements.get('${this.tag}'))`)
    let waitFuncString = this.waitForReady.toString(),
      waitFuncArgs = this.getWaitFuncArgs(),
      errorEvents: WindowErrorRegistration[] = [
        'error', 'unhandledrejection', 'unhandledRejection', ['loaded', false], ...this.errorEvents,
      ],
      errorEventsAfterRegistrationGenerators = this.waitForEventHandlersRegistrationThenEvents(errorEvents, 'window')
    await this.page.evaluate(initComponentString =>
      window['initComponent'] =
        window['utils'].makeFunctionFromStringified(initComponentString)
    , this.initComponent.toString())
    await errorEventsAfterRegistrationGenerators.next()
    let element = await Promise.race([
      errorEventsAfterRegistrationGenerators.next().catch(e => {
        if (e.message && e.message.includes('Target closed'))
          return
        throw e
      }),
      this.page.evaluate(async (tag, waitFuncString, initComponentArgs, waitFuncArgs) => {
        let waitForReady = window['utils'].makeFunctionFromStringified(waitFuncString)
        let el = document.createElement(tag)
        window['initComponent'](el, ...initComponentArgs)
        document.body.appendChild(el)
        customElements.upgrade(el)
        window['element'] = el
        await (waitForReady(el, ...waitFuncArgs)
          .catch(x => {
            if (x.message === undefined && x.stack === undefined)
              return
            throw x
          }))
      }, this.tag, waitFuncString, this.initComponentArgs, waitFuncArgs).then(async () => {
        await this.page.waitForSelector(`#${this.componentElementId}`)
        return await this.page.$(`#${this.componentElementId}`)
      }),
    ]) as unknown as puppeteer.ElementHandle
    await this.page.evaluate('function getConvenienceGlobals() { return {element} }')
    if (t)
      for (let name of ['', '$', '$$'].map(s => s + 'eval'))
        t[name] = (...args) => this[name].call(this, ...args)
    return this.component = element
  }

  protected async waitForEvent(event: WindowErrorRegistration, selector: string = `#${this.componentElementId}`, isGlobalVar: boolean = false) {
    let generator = this.waitForEventHandlersRegistrationThenEvents([event], selector, isGlobalVar)
    await generator.next()
    return await generator.next()
  }
  // TODO: register all events at once
  protected async *waitForEventHandlersRegistrationThenEvents(events: WindowErrorRegistration[], selector: string = `#${this.componentElementId}`, isGlobalVar: boolean = false) {
    events = events.map(event => event instanceof Array
      ? event
      : [event, true])
    let eventNames = events.map(ev => ev[0])
    let funcName = 'polytestHandleError' + crypto.randomBytes(10).toString('hex')
    let subject = new Subject<[number, any]>()
    await this.page.exposeFunction(funcName, (i, err) => {
      try {
        err = utils.parseSerializedError(err)
        if (err instanceof Error)
          subject.error(err)
        else {
          subject.next([i, err])
          subject.complete()
        }
      } catch (e) {
        subject.error(e)
      }
    })
    await this.page.evaluate(async (eventNames, funcName, selector, isGlobalVar) => {
      window[funcName + 'Handler'] = i => function(x, e) {
        let error
        try {
          removeErrorListeners()
          error = getErrorFromEvent(e) || getErrorFromEvent(x)
          throw error
        } catch (e) {
          error = window['utils'].makeWindowErrorSerializable(e)
        }
        
        //@ts-ignore
        window[funcName](i, error)

        function getErrorFromEvent(e) {
          return e && ((e.detail && e.detail.error) || e.error || e.reason) || e
        }
      }
      let el = selector === 'window'
        ? window
        : isGlobalVar
          ? window[selector]
          : document.querySelector(selector)
      for (let [i, eventName] of Object.entries(eventNames))
        el.addEventListener(eventName, window[funcName + 'Handler'](Number(i)))
      
      function removeErrorListeners() {
        for (let eventName of eventNames)
          el.removeEventListener(eventName, window[funcName + 'Handler'])
      }
    }, eventNames, funcName, selector, isGlobalVar)
    yield
    return await subject.toPromise().then(([i, x]) => {
      if (events[i][1]) {throw (x['reason'] || x)}
      return x
    })
  }

  protected getWaitFuncArgs(): any[] {
    return []
  }
  protected abstract async waitForReady(element: Element, ...additional: any[])

  protected eval<T = any>(func: EvaluateFn, ...args: any[]): Promise<T> {
    return this._eval('evaluate', func, ...args)
  }
  protected $eval<T = any>(selector: string, func: EvaluateFn<Element>, ...args: any[]): Promise<T> {
    return this._eval('$eval', selector, func, ...args)
  }
  protected $$eval<T = any>(selector: string, func: EvaluateFn<Element[]>, ...args: any[]): Promise<T> {
    return this._eval('$$eval', selector, func, ...args)
  }
  private async _eval<T = any>(pageMethod, func: EvaluateFn, ...args: any[]): Promise<T>
  private async _eval<T = any>(pageMethod, selector: string, func: EvaluateFn, ...args: any[]): Promise<T> {
    if (pageMethod.includes('$') === false) {
      if (func !== undefined || args.length !== 0)
        args = [func, ...args]
      func = selector
      selector = null
    }
    if (func instanceof Function) {
      let wrapped = this.wrapEvalFunc(args, func) 
      args = wrapped.args
      func = wrapped.func
    }
    return selector
      ? this.page[pageMethod](selector, func, ...args)
      : this.page[pageMethod](func, ...args)
  }

  private wrapEvalFunc(args, func) {
    return {
      args: [func.toString(), func.length, ...args],
      func: (maybeElement, evalFuncString, evalFuncArgLength, ...args) => {
        if (maybeElement !== `${maybeElement}`)
          args = [maybeElement, ...args]
        else {
          if (evalFuncArgLength !== undefined) args = [evalFuncArgLength, ...args]
          evalFuncArgLength = evalFuncString
          evalFuncString = maybeElement
        }
        let argDiff = args.length - evalFuncArgLength
        let index = evalFuncArgLength - (argDiff ? 1 : 0)
        args.splice(index, 0, window['getConvenienceGlobals']())
        return window['utils'].makeFunctionFromStringified(evalFuncString)(...args)
      },
    }
  }
}
