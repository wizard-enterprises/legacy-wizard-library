import { Suite, Test, SubSuite, TestSuite } from 'polymorphic-tests'
import { LitElementSuite } from 'polymorphic-web-component-tests'

@Suite() class ExpandingList extends TestSuite {}

abstract class ExpandingListSuite extends LitElementSuite {
  static componentPath = require.resolve('.')
  static componentTag = 'wizard-expanding-list'
  createComponentInPageSetup = false
  protected items?: string[]
  protected abstract addTo?: string

  protected async createComponent(t, ...initialItems: string[]) {
    if (initialItems.length === 0) initialItems = this.items || []
    let comp =  await super.createComponent(t)
    await t.eval(`
    listElement = () => element.renderRoot.querySelector('#list')
    inputElement = () => element.renderRoot.querySelector('#input')
    addButton = () => element.renderRoot.querySelector('#add-button')
    `)
    if (this.addTo)
      await t.eval((addTo, {element}) =>
        element.setAttribute('addTo', addTo)
      , this.addTo)
    if (initialItems.length)
      await t.eval((initialItems, {element}) =>
        element.setAttribute('items', JSON.stringify(initialItems))
      , initialItems)
    await t.eval('element.updateComplete')
    return comp
  }

  @Test() async 'empty list'(t) {
    await this.createComponent(t)
    for (let element of ['listElement', 'inputElement', 'addButton'])
      t.expect(await t.eval(`Boolean(${element}())`)).to.equal(true)
  }

  @Test() async 'set input position'(t) {
    await this.createComponent(t)
    t.expect(true).to.equal(await this.verifyInputPosition(t,
      (inputIndex, listIndex) => inputIndex < listIndex))
    await t.eval(`element.setAttribute('inputAt', 'end') && element.updateComplete`)
    t.expect(true).to.equal(await this.verifyInputPosition(t,
      (inputIndex, listIndex) => inputIndex > listIndex))
  }

  private verifyInputPosition(t, cb) {
    return t.eval((cb, {element}) => {
      let children = Array.from(element.renderRoot.children),
        listIndex = children.indexOf(window['listElement']()),
        inputIndex = children.indexOf(window['inputElement']())
      cb = window['utils'].makeFunctionFromStringified(cb)
      return cb(inputIndex, listIndex)
    }, cb.toString())
  }

  @Test() async 'start list with items'(t) {
    this.items = ['one', 'two', 'three']
    await this.createComponent(t)
    t.expect(await this.getItems(t)).to.deep.equal(this.items)
  }

  @Test() async 'add item programmatically'(t) {
    this.items = ['one', 'two']
    await this.createComponent(t)
    await t.eval(`element.add('three')`)
    t.expect(await this.getItems(t)).to.deep.equal([...this.items, 'three'])
  }

  @Test() async 'add item with input and button'(t) {
    this.items = ['one', 'two']
    await this.createComponent(t)
    await t.eval(`utils.changeInputValue(inputElement(), ' three ')`)
    await t.eval(`addButton().click()`)
    t.expect(await t.eval('inputElement().value')).to.equal('')
    t.expect(await this.getItems(t)).to.deep.equal([...this.items, 'three'])
  }

  @Test() async 'add item with input and enter'(t) {
    this.items = ['one', 'two']
    await this.createComponent(t)
    await t.eval(`utils.changeInputValue(inputElement(), ' three ', 'Enter')`)
    t.expect(await t.eval('inputElement().value')).to.equal('')
    t.expect(await this.getItems(t)).to.deep.equal([...this.items, 'three'])
  }

  @Test() async 'add three items'(t) {
    let items = ['one', 'two', 'three']
    await this.createComponent(t)
    for (let item of items)
      await t.eval((item, {element}) =>
        element.add(item), item)
    t.expect(await this.getItems(t)).to.deep.equal(items)
  }

  protected getItems(t) {
    return t.eval(async ({element}) => {
      await element.updateComplete
      return Array.from(window['listElement']().querySelectorAll('li'))
        //@ts-ignore
        .map(el => el.textContent)
    })
  }
}

@SubSuite(ExpandingList) class AddToStart extends ExpandingListSuite {
  addTo = 'start'

  createComponent(t, ...initialItems) {
    if (initialItems.length === 0) initialItems = this.items || []
    initialItems = [...initialItems].reverse()
    return super.createComponent(t, ...initialItems)
  }

  async getItems(t) {
    let items = await super.getItems(t)
    return [...items].reverse()
  }
}

@SubSuite(ExpandingList) class AddToEnd extends ExpandingListSuite {
  addTo = 'end'
}