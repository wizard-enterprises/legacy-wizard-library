import { SubSuite, Test } from 'polymorphic-tests'
import { Pipeline } from '.'
import { PipeStatus } from '../..'
import { PipeSuite } from '../index.spec'
import { TransformPipe } from '../transform'
import { Pipeline as PipelineSuite } from './index.spec'

class AssemblyPipeline extends Pipeline {
  protected readonly assemblable = true
  public didAssemble = this['didAssemble'] || false
  protected _assemble(TransformPipeCtor = TransformPipe) {
    this.didAssemble = true
    this.pipes = [
      new TransformPipeCtor(x => x + 10),
      ...this.pipes,
      new TransformPipeCtor(x => x + 10),
    ]
    super._assemble()
  }
}

@SubSuite(PipelineSuite) class Assembly<PipelineT extends AssemblyPipeline> extends PipeSuite<PipelineT> {
  protected underTest = AssemblyPipeline as unknown as new (...args) => PipelineT

  protected makePipe(pipes = this.makeTestPipes(), opts = {}) {
    return super.makePipe(pipes, opts)
  }

  @Test() 'create unassembled pipeline'(t) {
    let pipe = this.makePipe()
    t.expect(pipe.status).to.equal(PipeStatus.unassembled)
    t.expect(pipe.run(0)).to.equal(30)
    t.expect(pipe.status).to.equal(PipeStatus.piped)
    t.expect(pipe.didAssemble).to.equal(false)
    for (let funcName of ['assemble', 'assembleInputHook', 'assembleOutputHook'])
      t.expect(() => pipe[funcName]()).to.throw(`Can't assemble assembled pipe`)
  }

  @Test() 'assemble unassembled pipeline'(t) {
    let pipe = this.makePipe().assemble() as unknown as AssemblyPipeline
    t.expect(pipe.status).to.equal(PipeStatus.clean)
    t.expect(pipe.run(0)).to.equal(50)
    t.expect(pipe.didAssemble).to.equal(true)
  }

  protected TransformPipe = TransformPipe
  private makeTestPipes() {
    return Array.from(Array(3), () =>
      new this.TransformPipe(x => x + 10))
  }
}

class CustomAssemblyPipeline extends AssemblyPipeline {
  public customCalls: number[] = []

  protected _assemble() {
    super._assemble(CustomTransformPipe)
  }

  protected makeAssemblyDelegate() {
    let self = this
    return {
      addCustomCall(num) {
        self.customCalls.push(num)
      }
    }
  }
}

class CustomTransformPipe extends TransformPipe {
  protected readonly assemblable = true

  beAssembled(delegate) {
    this.assembleOutputHook(output => delegate.addCustomCall(output))
  }
}

@SubSuite(PipelineSuite) class AdvancedAssembly extends Assembly<CustomAssemblyPipeline> {
  protected underTest = CustomAssemblyPipeline

  TransformPipe = CustomTransformPipe
  @Test() 'do custom assembly'(t) {
    let pipe = this.makePipe().assemble()
    t.expect(pipe.status).to.equal(PipeStatus.clean)
    t.expect(pipe.run(0)).to.equal(50)
    t.expect(pipe.customCalls).to.deep.equal(
      [10, 20, 30, 40, 50]
    )
  }
}