// export interface PipelineComponentDelegate<inputT = any, outputT = inputT> {
//   getInput(): inputT
//   next(output: outputT): void
// }

export enum PipeComponentType {
  inMemory = 'inMemory',
}
