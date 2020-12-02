import {MoreThanBuilder} from "./MoreThan";
import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const LessThanOrEqual = ComparatorGen(() => LessThanOrEqualBuilder);

export class LessThanOrEqualBuilder extends ComparatorBuilder {
    get operator(): string { return "<="; }
    negate = () => new MoreThanBuilder(this.negatedOperands);
}
