"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("../"));
function makeWindowErrorSerializable(e) {
    let data = JSON.parse(JSON.stringify(e, ['message', 'arguments', 'type', 'name', 'stack'])), error = new Error;
    for (let key in data)
        error[key] = data[key];
    return error;
}
exports.makeWindowErrorSerializable = makeWindowErrorSerializable;
function makeFunctionFromStringified(funcString) {
    if (!funcString.replace)
        throw new Error(`Can't make function from function string because it's not a string: ${funcString}`);
    funcString = funcString
        .replace(/^\s*(public|protected|private) /, '')
        .replace(/^\s*export /, '')
        .replace(/^\s*(module\.)?exports = /, '');
    if ([
        /^\s*\(/,
        /^\s*(async\s+)?function/,
        /^\s*[\w\d_]+\s*\=\>/,
    ].find(regex => funcString.match(regex)) === undefined) {
        funcString = funcString.match(/^\s*async/)
            ? funcString.replace('async', 'async function')
            : 'function ' + funcString;
    }
    return new Function(`return (${funcString}).apply(window, arguments)`);
}
exports.makeFunctionFromStringified = makeFunctionFromStringified;
//# sourceMappingURL=index.js.map