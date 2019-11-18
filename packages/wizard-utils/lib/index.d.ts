export declare function makeStringEnum<T extends string = string>(...members: string[]): {
    T: T;
};
export declare function jsonStringifyWithEscapedCircularRefs(obj: Object): string;
