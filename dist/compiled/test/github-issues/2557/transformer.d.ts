export declare class WrappedNumber {
    private wrapped;
    constructor(wrapped: number);
    getWrapped(): number;
}
export declare const transformer: {
    lastValue: any;
    from(val: number): WrappedNumber;
    to(w: WrappedNumber): number;
};
