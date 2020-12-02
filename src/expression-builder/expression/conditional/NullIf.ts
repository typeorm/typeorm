import { FunctionBuilder } from "../Function";
import { Expression } from "../../Expression";

export function NullIf(a: Expression, b: Expression) {
    return new NullIfBuilder([a, b]);
}

export class NullIfBuilder extends FunctionBuilder<[Expression, Expression]> {
    get name() { return "NULLIF"; }
}
