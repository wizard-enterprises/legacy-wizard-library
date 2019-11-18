polymorphic-tests
=================

Description

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/polymorphic-tests.svg)](https://npmjs.org/package/polymorphic-tests)
[![Downloads/week](https://img.shields.io/npm/dw/polymorphic-tests.svg)](https://npmjs.org/package/polymorphic-tests)
[![License](https://img.shields.io/npm/l/polymorphic-tests.svg)](https://github.com/wizard-enterprises/polymorphic-tests/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g polymorphic-tests
$ polytest COMMAND
running command...
$ polytest (-v|--version|version)
polymorphic-tests/0.1.7 linux-x64 node-v12.13.0
$ polytest --help [COMMAND]
USAGE
  $ polytest COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`polytest hello [FILE]`](#polytest-hello-file)
* [`polytest help [COMMAND]`](#polytest-help-command)

## `polytest hello [FILE]`

describe the command here

```
USAGE
  $ polytest hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ polytest hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/wizard-enterprises/polymorphic-tests/blob/v0.1.7/src/commands/hello.ts)_

## `polytest help [COMMAND]`

display help for polytest

```
USAGE
  $ polytest help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_
<!-- commandsstop -->
