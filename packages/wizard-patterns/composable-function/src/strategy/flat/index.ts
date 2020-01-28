import { makeNamed } from 'wizard-utils'
import { SubFunctionStrategy } from '../abstract/subfunction'

export class FlatStrategy extends SubFunctionStrategy {
  protected wrapSubFunction(func, name) {
    return makeNamed(name, func)
  }
}