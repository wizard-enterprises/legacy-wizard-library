"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeStringEnum(...members) {
    return members.reduce((acc, member) => (Object.assign(Object.assign({}, acc), { [member]: member })), {});
}
exports.makeStringEnum = makeStringEnum;
function jsonStringifyWithEscapedCircularRefs(obj) {
    return JSON.stringify(obj, (() => {
        let seen = new WeakSet();
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value))
                    return `[circular: ${key}]`;
                seen.add(value);
            }
            return value;
        };
    })());
}
exports.jsonStringifyWithEscapedCircularRefs = jsonStringifyWithEscapedCircularRefs;
//# sourceMappingURL=index.js.map