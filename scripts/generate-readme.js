const fs = require('fs').promises,
  path = require('path')

class ReadmeGenerator {
  constructor() {
    this.fs = new MonorepoFs(process.cwd())
  }

  async run() {
    let readmeContent = await this.generateOutput()
    await this.fs.writeReadmeFile(readmeContent)
  }

  async generateOutput() {
    let sections = await this.makeOutputSections()
    return sections.join('\n\n')
  }

  async makeOutputSections() {
    return [
      await this.makeIntroSection(),
      await this.makePackagesSection(),
    ]
  }

  async makeIntroSection() {
    let { name, description } = await this.fs.readPackageJson()
    return `\
# ${name}
${description}`
  }

  async makePackagesSection() {
    let sectionNames = await this.fs.getPackagesNames()
    let sections = await Promise.all(sectionNames.map(name =>
      this.makeListItemForPackage(name)))
    return `\
## Packages
${sections.join('\n')}`
  }

  async makeListItemForPackage(packageName, containerDir = null, indent = '') {
    let path = this.fs.relativePackagePath(containerDir || '', packageName),
      isContainer = await this.fs.isPackageContainer(path),
      output = indent + `- [${packageName}](${path})`
    if (isContainer === false) {
      let { description } = await this.fs.readPackageJson(path)
      output += ` - ${description}`
    } else {
      for (let subPackageName of await this.fs.getPackagesNames(path))
        output += '\n' + await this.makeListItemForPackage(subPackageName, packageName, indent + '  ')
    }
    return output
  }
}

class MonorepoFs {
  constructor(monorepoPath) {
    this.monorepoPath = monorepoPath
  }

  async writeReadmeFile(content) {
    await fs.writeFile(this.path('README.md'), content)
  }

  async readPackageJson(relativePath = '') {
    let packagePath = this.path(relativePath, 'package.json'),
      content = await fs.readFile(packagePath)
    return JSON.parse(content)
  }

  async getPackagesNames(packagesDir = 'packages') {
    let packagesDirEntries =
      await fs.readdir(this.path(packagesDir), { withFileTypes: true })
    return packagesDirEntries
      .filter(e => e.isDirectory)
      .map(e => e.name)
  }

  async isPackageContainer(relativeDir) {
    let doesHavePackageFile = await this.isPathAccessible(this.path(relativeDir, 'package.json'))
    return !doesHavePackageFile
  }

  packagePath(name) {
    return this.path(this.relativePackagePath(name))
  }
  
  relativePackagePath(...joinArgs) {
    return path.join('packages', ...joinArgs)
  }

  path(...joinArgs) {
    return path.join(this.monorepoPath, ...joinArgs)
  }

  async isPathAccessible(path) {
    try {
      await fs.access(path)
      return true
    } catch (e) {
      return false
    }
  }
}

new ReadmeGenerator().run()
