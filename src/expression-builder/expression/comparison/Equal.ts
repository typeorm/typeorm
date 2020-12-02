import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const Equal = ComparatorGen(() => EqualBuilder);
export const NotEqual = ComparatorGen(() => NotEqualBuilder);

export class EqualBuilder extends ComparatorBuilder {
    get operator(): string { return "="; }
    negate = () => new NotEqualBuilder(this.negatedOperands);
}

export class NotEqualBuilder extends ComparatorBuilder {
    get operator(): string { return "!="; }
    negate = () => new EqualBuilder(this.negatedOperands);
}
