import {IsNotBuilder} from "./IsNot";
import {Expression} from "../../Expression";
import {Null} from "../misc/Null";
import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const Is = ComparatorGen(() => IsBuilder);
export function IsNull(expression?: Expression) {
    if (expression) return Is(expression, Null());
    return Is(Null());
}

export class IsBuilder extends ComparatorBuilder {
    get operator(): string { return "IS"; }
    negate = () => new IsNotBuilder(this.negatedOperands);
}
