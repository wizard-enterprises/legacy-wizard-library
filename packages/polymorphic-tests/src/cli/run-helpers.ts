import * as path from 'path'
import * as packageJson from 'pjson'
import { CliOptionOverrides, defaultConfig, PolytestConfig } from './index-types'

export async function composeConfig(options: CliOptionOverrides = {}, startFromDefaultConfig = true) {
  let composed: Partial<PolytestConfig> = {},
    merged = mergeConfigs(
      (startFromDefaultConfig ? defaultConfig : {}),
      (await readConfigFromPackageJson()),
      (await readConfigFromConfigFile()),
      options,
    )
  for (let key of Object.keys(defaultConfig))
    composed[key] = merged[key]
  return composed as PolytestConfig
}

function mergeConfigs(...configs: Partial<PolytestConfig>[]) {
  let isKeyRelevantForMerge = (obj, key) =>
      Object.keys(defaultConfig).includes(key)
      && obj[key]
      && (obj[key] instanceof Array && obj[key].length === 0) === false,
    omitIrrelevantValues = obj => {
      obj = {...obj}
      Object.keys(obj)
        .filter(key => !isKeyRelevantForMerge(obj, key))
        .forEach(k => delete obj[k])
      return obj as Partial<PolytestConfig>
    }
  return Object.assign({}, ...configs.map(omitIrrelevantValues)) as PolytestConfig
}

async function readConfigFromPackageJson() {
  return packageJson['polytest'] || {}
}

function readConfigFromConfigFile() {
  let filePath = path.join(process.cwd(), 'polytest.js')
  return import(filePath).then(content =>
    content.default
  ).catch(e => ({}))
}
