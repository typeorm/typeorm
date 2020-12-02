import { OperatorBuilder } from "../Operator";
import { Expression } from "../../Expression";

export class RightShiftBuilder extends OperatorBuilder<[Expression, Expression]> {
    get operator(): string { return ">>"; }
}
