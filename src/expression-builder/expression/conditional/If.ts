import { FunctionBuilder } from "../Function";
import { Expression } from "../../Expression";

export function If(expression: Expression, then: Expression, otherwise?: Expression) {
    return new IfBuilder(otherwise === undefined ? [expression, then] : [expression, then, otherwise]);
}

export class IfBuilder extends FunctionBuilder<[Expression, Expression] | [Expression, Expression, Expression]> {
    get name(): string { return "IF"; }
}
