import { FunctionBuilder } from "../Function";
import { Expression } from "../../Expression";

export function Length(expression: Expression) {
    return new LengthBuilder([expression]);
}

export class LengthBuilder extends FunctionBuilder<[Expression]> {
    get name(): string { return "LENGTH"; }
}
