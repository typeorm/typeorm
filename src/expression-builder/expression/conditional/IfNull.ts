import { FunctionBuilder } from "../Function";
import { Expression } from "../../Expression";

export function IfNull(a: Expression, b: Expression) {
    return new IfNullBuilder([a, b]);
}

export class IfNullBuilder extends FunctionBuilder<[Expression, Expression]> {
    get name(): string { return "IFNULL"; }
}
