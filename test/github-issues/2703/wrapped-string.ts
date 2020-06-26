import { ValueTransformer } from "@typeorm/core";

export class WrappedString {
    constructor(readonly value: string) {}
}

export const wrappedStringTransformer: ValueTransformer = {
    from(value: string): WrappedString {
        return new WrappedString(value);
    },
    to(value: WrappedString): string {
        return value.value;
    }
};
