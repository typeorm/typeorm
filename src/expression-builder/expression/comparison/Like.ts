import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const Like = ComparatorGen(() => LikeBuilder);

export class LikeBuilder extends ComparatorBuilder {
    get operator(): string { return "LIKE"; }
    negate = () => new NotLikeBuilder(this.negatedOperands);
}

export class NotLikeBuilder extends ComparatorBuilder {
    get operator(): string { return "NOT LIKE"; }
    negate = () => new LikeBuilder(this.negatedOperands);
}
