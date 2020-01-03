import { customElement } from 'lit-element'
import { PipelineElement } from '.'
import '../pipes'

@customElement('wizard-pipeline-for-tests')
export class PipelineElementForTests<inputT = any, outputT = inputT> extends PipelineElement<inputT, outputT> {
  public getPipeSlot() { return this.pipeSlot }
}
