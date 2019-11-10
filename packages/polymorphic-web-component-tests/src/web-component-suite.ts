import { TestSuite } from 'polymorphic-tests'
import { CachedReturn } from 'wizard-decorators'
import { build } from './web-component-webpack-build'
import fs from 'fs'
import rimraf from 'rimraf'
import path from 'path'
import puppeteer, {EvaluateFn} from 'puppeteer'
import pkgUp from 'pkg-up'
import express, {Application} from 'express'
import { Subject } from 'rxjs'
import { puppeteer as utils } from 'wizard-utils'
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
  protected errorEvents: string[] = []

  private get tag() {
    //@ts-ignore
    return this.constructor.componentTag
  }

  protected browser: puppeteer.Browser
  protected page: puppeteer.Page
  protected component: puppeteer.JSHandle
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
    return path.resolve(path.dirname(await pkgUp()), 'web-component-temp-build/')
  }

  @CachedReturn
  private async buildForComponentHtmlFiles() {
    return build(await this.getTempBuildDir(), WebComponentSuite.components)
  }
  
  private deleteTempBuild() {
    return new Promise(async (resolve, reject) => rimraf(await this.getTempBuildDir(), e => e ? reject(e) : resolve()))
  }

  protected createComponentInBefore = true
  async before(t) {
    super.before(t)
    let url = await this.setupComponentUrl()
    await this.setupPuppeteerPage(url)
    if (this.createComponentInBefore)
      this.component = await this.createComponent(t)
  }

  async after(t) {
    if (this.component) await this.component.dispose()
    if (this.page) await this.page.close()
    if (this.browser) await this.browser.close()
    if (this.serverListener) this.serverListener.close()
    await super.after(t)
  }

  private async setupComponentUrl() {
    let app = express()
    app.use(express.static(await this.getTempBuildDir()))
    this.serverListener = app.listen()
    //@ts-ignore
    return `http://127.0.0.1:${this.serverListener.address().port}/${this.tag}.html`
  }

  private async setupPuppeteerPage(url) {
    this.browser = await puppeteer.launch(this.puppeteerOpts)
    this.page = await this.browser.newPage()
    this.page.setBypassCSP(true)
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
    })
    await this.page.exposeFunction('log', console.log)
    await this.page.exposeFunction('error', console.error)
    await this.exposeUtilsOnPage(utils)
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
        window['utils'][name] = window['utils'].makeFunctionFromStringified(utilString)
    }, utilStrings)
  }

  protected async createComponent(t): Promise<puppeteer.ElementHandle> {
    await this.page.waitForFunction(`Boolean(customElements.get('${this.tag}'))`)
    let waitFuncString = this.waitForReady.toString(),
      waitFuncArgs = this.getWaitFuncArgs(),
      errorEvents = [
        'error', 'unhandledrejection', ...this.errorEvents,
      ],
      errorEventsAfterRegistrationGenerators = errorEvents.map(event =>
        this.waitForEventHandlerRegistrationThenEvent(event, 'window'))
    await Promise.all(errorEventsAfterRegistrationGenerators.map(gen => gen.next()))
    let element = await Promise.race([
      ...errorEventsAfterRegistrationGenerators.map(eventPromiseGenerator =>
        (eventPromiseGenerator.next() as unknown as Promise<any>)
          .then(ev => {throw (ev.reason || ev)})
          .catch(({value: e}) => {
            if (e.message && e.message.includes('Target closed'))
              return
            throw e
          })
      ),
      this.page.evaluate(async (tag, waitFuncString, ...waitFuncArgs) => {
        let waitForReady = window['utils'].makeFunctionFromStringified(waitFuncString)
        let el = document.createElement(tag)
        el.id = 'component'
        document.body.appendChild(el)
        customElements.upgrade(el)
        window['element'] = el
        await (waitForReady(el, ...waitFuncArgs)
          .catch(x => {
            if (x.message === undefined && x.stack === undefined)
              return
            throw x
          }))
      }, this.tag, waitFuncString, ...waitFuncArgs).then(async () => {
        await this.page.waitForSelector(`#${this.componentElementId}`)
        return await this.page.$(`#${this.componentElementId}`)
      }),
    ]).catch(e => {throw e}) as unknown as puppeteer.ElementHandle
    await this.page.evaluate('function getConvenienceGlobals() { return {element} }')
    if (t) {
      //@ts-ignore
      t.eval = this.eval.bind(this)
      //@ts-ignore
      t.$eval = this.$eval.bind(this)
      //@ts-ignore
      t.$$eval = this.$$eval.bind(this)
    }
    return this.component = element
  }

  protected waitForEvent(eventName: string, selector: 'window')
  protected async waitForEvent(eventName: string, selector: string = `#${this.componentElementId}`) {
    let generator = this.waitForEventHandlerRegistrationThenEvent(eventName, selector)
    await generator.next()
    return await generator.next()
  }
  protected async *waitForEventHandlerRegistrationThenEvent(eventName: string, selector: string = `#${this.componentElementId}`) {
    let funcName = ['polytestHandleError', eventName, Date.now()].join('_')
    let subject = new Subject
    try {
      await this.page.exposeFunction(funcName, async err => {
        if (err instanceof Error)
          subject.error(err)
        else {
          subject.next(err)
          subject.complete()
        }
      })
      await this.page.evaluate(async (eventName, funcName, selector) => {
        window[funcName + 'Data'] = {eventName, selector}
        window[funcName + 'Handler'] = async function(x, e, ...args) {
          let error
          try {
            let {selector, eventName} = window[funcName + 'Data'] 
            ;(selector === 'window' ? window : document.body.querySelector(selector)).removeEventListener(eventName, window[funcName + 'Handler'])
            error =
              e && ((e.detail && e.detail.error) || e.error || e.reason) || e
              || x && ((x.detail && x.detail.error) || x.error || x.reason) || x
            throw error
          } catch (e) {
            error = window['utils'].makeWindowErrorSerializable(e)
          }
          
          //@ts-ignore
          return await window[funcName](error)
        }
      }, eventName, funcName, selector)
      let doWait = async (el, funcName, eventName, selector) => {
        if (selector === 'window' && el === null) el = window
        el.addEventListener(eventName, window[funcName + 'Handler'])
      }
      await (selector === 'window'
        ? this.page.evaluate(doWait, null, funcName, eventName, selector)
        : this.page.$eval(selector, doWait, funcName, eventName, selector))
      yield
      return await subject.toPromise()
    } catch (e) {
      return Promise.reject(e)
    }
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
      args = [func.toString(), func.length, ...args]
      func = (maybeElement, evalFuncString, evalFuncArgLength, ...args) => {
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
      }
    }
    return selector
      ? this.page[pageMethod](selector, func, ...args)
      : this.page[pageMethod](func, ...args)
  }
}
