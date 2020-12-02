import {IsBuilder} from "./Is";
import {Expression} from "../../Expression";
import {Null} from "../misc/Null";
import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const IsNot = ComparatorGen(() => IsNotBuilder);
export function IsNotNull(expression?: Expression) {
    if (expression) return IsNot(expression, Null());
    return IsNot(Null());
}

export class IsNotBuilder extends ComparatorBuilder {
    get operator(): string { return "IS NOT"; }
    negate = () => new IsBuilder(this.negatedOperands);
}
