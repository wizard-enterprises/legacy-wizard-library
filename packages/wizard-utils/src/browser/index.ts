export * from '..'

export function waitForSelectorOn(element, selector) {
  return new Promise((resolve, reject) => {
    try {
      let opts = {subtree: true, attributes: false, childList: true}
      let observer = new MutationObserver(() => {
        let selected = element.renderRoot.querySelector(selector)
        if (selected === null) return
        observer.disconnect()
        resolve(selected)
      })
      observer.observe(element, opts)
    } catch (e) {
      reject(e)
    } 
  })
}
