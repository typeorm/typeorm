import { FunctionBuilder } from "../Function";
import { Expression } from "../../Expression";

export function Coalesce(expression: Expression, ...expressions: Expression[]): CoalesceBuilder;
export function Coalesce(...expressions: Expression[]): CoalesceBuilder {
    return new CoalesceBuilder(expressions);
}

export class CoalesceBuilder extends FunctionBuilder<Expression[]> {
    get name(): string { return "COALESCE"; }
}
