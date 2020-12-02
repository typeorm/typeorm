import { OperatorBuilder, OperatorGen } from "../../Operator";
import { Expression } from "../../../Expression";

export const Multiply = OperatorGen(() => MultiplyBuilder);

export class MultiplyBuilder extends OperatorBuilder<[Expression, Expression, ...Expression[]]> {
    get operator(): string { return "*"; }
}
