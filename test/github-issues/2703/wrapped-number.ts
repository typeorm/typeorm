import {ValueTransformer} from "../../../src/decorator/options/ValueTransformer";

export class WrappedNumber {
    constructor(readonly value: number) {}
}

export const wrappedNumberTransformer: ValueTransformer = {
    from(value: number): WrappedNumber {
        return new WrappedNumber(value);
    },
    to(value: WrappedNumber): number {
        return value.value;
    }
};
