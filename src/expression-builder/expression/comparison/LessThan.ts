import {MoreThanOrEqualBuilder} from "./MoreThanOrEqual";
import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const LessThan = ComparatorGen(() => LessThanBuilder);

export class LessThanBuilder extends ComparatorBuilder {
    get operator(): string { return "<"; }
    negate = () => new MoreThanOrEqualBuilder(this.negatedOperands);
}
