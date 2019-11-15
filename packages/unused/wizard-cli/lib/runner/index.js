"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = run;

var path = _interopRequireWildcard(require("path"));

var _fs = require("fs");

var _yargsParser = _interopRequireDefault(require("yargs-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

async function run(commandsDirPath, argv = process.argv.slice(2)) {
  let args = (0, _yargsParser.default)(argv),
      cliMetadata = await getCliMetadata(commandsDirPath),
      rootCommand = Object.entries(cliMetadata)[0],
      command = findCommand(rootCommand[1], args);
  return runCommand(command, args);
}

function findCommand(rootCommand, args) {
  let command = rootCommand,
      removeFromArgs = 0;

  for (let cmd of args._) {
    if (!command.subCommands || !command.subCommands[cmd]) break;
    command = command.subCommands[cmd];
    removeFromArgs++;
  }

  args._ = args._.slice(removeFromArgs);
  return command;
}

function runCommand(command, args) {
  let Command = require(command.path).default,
      cmdInstance = new Command(),
      runArgs = cmdInstance.validateAndParseArgs(...args._);

  return cmdInstance.run(...runArgs);
}

async function getCliMetadata(commandsDirPath) {
  let cliMetadataPath = path.join(commandsDirPath, 'cli-metadata.json');
  await verifyMetadataFileExists(cliMetadataPath);
  return parseMetadataFile(cliMetadataPath);
}

async function verifyMetadataFileExists(path) {
  try {
    await _fs.promises.stat(path);
  } catch (e) {
    throw new Error(`CLI metadata file doesn't exist at ${path}`);
  }
}

async function parseMetadataFile(path) {
  try {
    return JSON.parse((await _fs.promises.readFile(path)));
  } catch (e) {
    throw new Error(`Couldn't parse CLI metadata file at ${path}`);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydW5uZXIvaW5kZXguanMiXSwibmFtZXMiOlsicnVuIiwiY29tbWFuZHNEaXJQYXRoIiwiYXJndiIsInByb2Nlc3MiLCJzbGljZSIsImFyZ3MiLCJjbGlNZXRhZGF0YSIsImdldENsaU1ldGFkYXRhIiwicm9vdENvbW1hbmQiLCJPYmplY3QiLCJlbnRyaWVzIiwiY29tbWFuZCIsImZpbmRDb21tYW5kIiwicnVuQ29tbWFuZCIsInJlbW92ZUZyb21BcmdzIiwiY21kIiwiXyIsInN1YkNvbW1hbmRzIiwiQ29tbWFuZCIsInJlcXVpcmUiLCJwYXRoIiwiZGVmYXVsdCIsImNtZEluc3RhbmNlIiwicnVuQXJncyIsInZhbGlkYXRlQW5kUGFyc2VBcmdzIiwiY2xpTWV0YWRhdGFQYXRoIiwiam9pbiIsInZlcmlmeU1ldGFkYXRhRmlsZUV4aXN0cyIsInBhcnNlTWV0YWRhdGFGaWxlIiwiZnMiLCJzdGF0IiwiZSIsIkVycm9yIiwiSlNPTiIsInBhcnNlIiwicmVhZEZpbGUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFTyxlQUFlQSxHQUFmLENBQW1CQyxlQUFuQixFQUFvQ0MsSUFBSSxHQUFHQyxPQUFPLENBQUNELElBQVIsQ0FBYUUsS0FBYixDQUFtQixDQUFuQixDQUEzQyxFQUFrRTtBQUN2RSxNQUFJQyxJQUFJLEdBQUcsMEJBQU1ILElBQU4sQ0FBWDtBQUFBLE1BQ0VJLFdBQVcsR0FBRyxNQUFNQyxjQUFjLENBQUNOLGVBQUQsQ0FEcEM7QUFBQSxNQUVFTyxXQUFXLEdBQUdDLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlSixXQUFmLEVBQTRCLENBQTVCLENBRmhCO0FBQUEsTUFHRUssT0FBTyxHQUFHQyxXQUFXLENBQUNKLFdBQVcsQ0FBQyxDQUFELENBQVosRUFBaUJILElBQWpCLENBSHZCO0FBSUEsU0FBT1EsVUFBVSxDQUFDRixPQUFELEVBQVVOLElBQVYsQ0FBakI7QUFDRDs7QUFFRCxTQUFTTyxXQUFULENBQXFCSixXQUFyQixFQUFrQ0gsSUFBbEMsRUFBd0M7QUFDdEMsTUFBSU0sT0FBTyxHQUFHSCxXQUFkO0FBQUEsTUFDRU0sY0FBYyxHQUFHLENBRG5COztBQUVBLE9BQUssSUFBSUMsR0FBVCxJQUFnQlYsSUFBSSxDQUFDVyxDQUFyQixFQUF3QjtBQUN0QixRQUFJLENBQUNMLE9BQU8sQ0FBQ00sV0FBVCxJQUF3QixDQUFDTixPQUFPLENBQUNNLFdBQVIsQ0FBb0JGLEdBQXBCLENBQTdCLEVBQ0U7QUFDRkosSUFBQUEsT0FBTyxHQUFHQSxPQUFPLENBQUNNLFdBQVIsQ0FBb0JGLEdBQXBCLENBQVY7QUFDQUQsSUFBQUEsY0FBYztBQUNmOztBQUNEVCxFQUFBQSxJQUFJLENBQUNXLENBQUwsR0FBU1gsSUFBSSxDQUFDVyxDQUFMLENBQU9aLEtBQVAsQ0FBYVUsY0FBYixDQUFUO0FBQ0EsU0FBT0gsT0FBUDtBQUNEOztBQUVELFNBQVNFLFVBQVQsQ0FBb0JGLE9BQXBCLEVBQTZCTixJQUE3QixFQUFtQztBQUNqQyxNQUFJYSxPQUFPLEdBQUdDLE9BQU8sQ0FBQ1IsT0FBTyxDQUFDUyxJQUFULENBQVAsQ0FBc0JDLE9BQXBDO0FBQUEsTUFDRUMsV0FBVyxHQUFHLElBQUlKLE9BQUosRUFEaEI7QUFBQSxNQUVFSyxPQUFPLEdBQUdELFdBQVcsQ0FBQ0Usb0JBQVosQ0FBaUMsR0FBR25CLElBQUksQ0FBQ1csQ0FBekMsQ0FGWjs7QUFHQSxTQUFPTSxXQUFXLENBQUN0QixHQUFaLENBQWdCLEdBQUd1QixPQUFuQixDQUFQO0FBQ0Q7O0FBRUQsZUFBZWhCLGNBQWYsQ0FBOEJOLGVBQTlCLEVBQStDO0FBQzdDLE1BQUl3QixlQUFlLEdBQUdMLElBQUksQ0FBQ00sSUFBTCxDQUFVekIsZUFBVixFQUEyQixtQkFBM0IsQ0FBdEI7QUFDQSxRQUFNMEIsd0JBQXdCLENBQUNGLGVBQUQsQ0FBOUI7QUFDQSxTQUFPRyxpQkFBaUIsQ0FBQ0gsZUFBRCxDQUF4QjtBQUNEOztBQUVELGVBQWVFLHdCQUFmLENBQXdDUCxJQUF4QyxFQUE4QztBQUM1QyxNQUFJO0FBQ0YsVUFBTVMsYUFBR0MsSUFBSCxDQUFRVixJQUFSLENBQU47QUFDRCxHQUZELENBRUUsT0FBT1csQ0FBUCxFQUFVO0FBQ1YsVUFBTSxJQUFJQyxLQUFKLENBQVcsc0NBQXFDWixJQUFLLEVBQXJELENBQU47QUFDRDtBQUNGOztBQUVELGVBQWVRLGlCQUFmLENBQWlDUixJQUFqQyxFQUF1QztBQUNyQyxNQUFJO0FBQ0YsV0FBT2EsSUFBSSxDQUFDQyxLQUFMLEVBQVcsTUFBTUwsYUFBR00sUUFBSCxDQUFZZixJQUFaLENBQWpCLEVBQVA7QUFDRCxHQUZELENBRUUsT0FBT1csQ0FBUCxFQUFVO0FBQ1YsVUFBTSxJQUFJQyxLQUFKLENBQVcsdUNBQXNDWixJQUFLLEVBQXRELENBQU47QUFDRDtBQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcydcbmltcG9ydCAgcGFyc2UgZnJvbSAneWFyZ3MtcGFyc2VyJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuKGNvbW1hbmRzRGlyUGF0aCwgYXJndiA9IHByb2Nlc3MuYXJndi5zbGljZSgyKSkge1xuICBsZXQgYXJncyA9IHBhcnNlKGFyZ3YpLFxuICAgIGNsaU1ldGFkYXRhID0gYXdhaXQgZ2V0Q2xpTWV0YWRhdGEoY29tbWFuZHNEaXJQYXRoKSxcbiAgICByb290Q29tbWFuZCA9IE9iamVjdC5lbnRyaWVzKGNsaU1ldGFkYXRhKVswXSxcbiAgICBjb21tYW5kID0gZmluZENvbW1hbmQocm9vdENvbW1hbmRbMV0sIGFyZ3MpXG4gIHJldHVybiBydW5Db21tYW5kKGNvbW1hbmQsIGFyZ3MpXG59XG5cbmZ1bmN0aW9uIGZpbmRDb21tYW5kKHJvb3RDb21tYW5kLCBhcmdzKSB7XG4gIGxldCBjb21tYW5kID0gcm9vdENvbW1hbmQsXG4gICAgcmVtb3ZlRnJvbUFyZ3MgPSAwXG4gIGZvciAobGV0IGNtZCBvZiBhcmdzLl8pIHtcbiAgICBpZiAoIWNvbW1hbmQuc3ViQ29tbWFuZHMgfHwgIWNvbW1hbmQuc3ViQ29tbWFuZHNbY21kXSlcbiAgICAgIGJyZWFrXG4gICAgY29tbWFuZCA9IGNvbW1hbmQuc3ViQ29tbWFuZHNbY21kXVxuICAgIHJlbW92ZUZyb21BcmdzKytcbiAgfVxuICBhcmdzLl8gPSBhcmdzLl8uc2xpY2UocmVtb3ZlRnJvbUFyZ3MpXG4gIHJldHVybiBjb21tYW5kXG59XG5cbmZ1bmN0aW9uIHJ1bkNvbW1hbmQoY29tbWFuZCwgYXJncykge1xuICBsZXQgQ29tbWFuZCA9IHJlcXVpcmUoY29tbWFuZC5wYXRoKS5kZWZhdWx0LFxuICAgIGNtZEluc3RhbmNlID0gbmV3IENvbW1hbmQsXG4gICAgcnVuQXJncyA9IGNtZEluc3RhbmNlLnZhbGlkYXRlQW5kUGFyc2VBcmdzKC4uLmFyZ3MuXylcbiAgcmV0dXJuIGNtZEluc3RhbmNlLnJ1biguLi5ydW5BcmdzKVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRDbGlNZXRhZGF0YShjb21tYW5kc0RpclBhdGgpIHtcbiAgbGV0IGNsaU1ldGFkYXRhUGF0aCA9IHBhdGguam9pbihjb21tYW5kc0RpclBhdGgsICdjbGktbWV0YWRhdGEuanNvbicpXG4gIGF3YWl0IHZlcmlmeU1ldGFkYXRhRmlsZUV4aXN0cyhjbGlNZXRhZGF0YVBhdGgpXG4gIHJldHVybiBwYXJzZU1ldGFkYXRhRmlsZShjbGlNZXRhZGF0YVBhdGgpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmeU1ldGFkYXRhRmlsZUV4aXN0cyhwYXRoKSB7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuc3RhdChwYXRoKVxuICB9IGNhdGNoIChlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDTEkgbWV0YWRhdGEgZmlsZSBkb2Vzbid0IGV4aXN0IGF0ICR7cGF0aH1gKVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBhcnNlTWV0YWRhdGFGaWxlKHBhdGgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShhd2FpdCBmcy5yZWFkRmlsZShwYXRoKSlcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ291bGRuJ3QgcGFyc2UgQ0xJIG1ldGFkYXRhIGZpbGUgYXQgJHtwYXRofWApXG4gIH1cbn0iXX0=