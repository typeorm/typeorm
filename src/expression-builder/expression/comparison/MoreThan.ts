import {LessThanOrEqualBuilder} from "./LessThanOrEqual";
import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const MoreThan = ComparatorGen(() => MoreThanBuilder);

export class MoreThanBuilder extends ComparatorBuilder {
    get operator(): string { return ">"; }
    negate = () => new LessThanOrEqualBuilder(this.negatedOperands);
}
