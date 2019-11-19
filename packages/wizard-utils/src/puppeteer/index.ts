export * from '../'

export function makeWindowErrorSerializable(e) {
  let data = JSON.parse(JSON.stringify(e, ['message', 'arguments', 'type', 'name', 'stack'])),
    error = new Error
  for (let key in data)
    error[key] = data[key]
  return error
}
