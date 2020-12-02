import {LessThanBuilder} from "./LessThan";
import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const MoreThanOrEqual = ComparatorGen(() => MoreThanOrEqualBuilder);

export class MoreThanOrEqualBuilder extends ComparatorBuilder {
    get operator(): string { return ">="; }
    negate = () => new LessThanBuilder(this.negatedOperands);
}
