export * from '..'

// Must be duplicate to maintain serializability of functions
// const errorSerializationKeys = ['message', 'arguments', 'type', 'name', 'stack']

export function makeWindowErrorSerializable(e) {
  let data = JSON.parse(JSON.stringify(e, ['message', 'arguments', 'type', 'name', 'stack'])),
    error = new Error
  for (let key in data)
    error[key] = data[key]
  return error
}

export function parseSerializedError(e) {
  if (isSerializedError(e) === false) return e
  let error = new Error
  for (let key in e)
    error[key] = e[key]
  return error

  function isSerializedError(e) {
    return e
      && e instanceof Object
      && e instanceof Error === false
      && ['message', 'arguments', 'type', 'name', 'stack'].filter(key => e[key]).length > 0
  }
}

export function changeInputValue(inputEl, value, key?) {
  inputEl.focus()
  inputEl.value = value
  inputEl.dispatchEvent(new Event('input', { bubbles: true }))
  inputEl.dispatchEvent(new Event('change', { bubbles: true }))
  if (key) (pressKey || window['utils'].pressKey)(inputEl, key)
  inputEl.blur()
}

export function pressKey(element, key, opts = {}) {
  opts = {...opts, key}
  element.dispatchEvent(new KeyboardEvent('keydown', opts))
  element.dispatchEvent(new KeyboardEvent('keyup', opts))
}
