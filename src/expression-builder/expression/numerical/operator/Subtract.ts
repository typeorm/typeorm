import { OperatorBuilder, OperatorGen } from "../../Operator";
import { Expression } from "../../../Expression";

export const Subtract = OperatorGen(() => SubtractBuilder);
export const Minus = Subtract;

export class SubtractBuilder extends OperatorBuilder<[Expression, Expression, ...Expression[]]> {
    get operator(): string { return "-"; }
}
