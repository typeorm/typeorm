import { OperatorBuilder } from "../Operator";
import { Expression } from "../../Expression";

export class LeftShiftBuilder extends OperatorBuilder<[Expression, Expression]> {
    get operator(): string { return "<<"; }
}
