import { OperatorBuilder, OperatorGen } from "../../Operator";
import { Expression } from "../../../Expression";

export const IntDivide = OperatorGen(() => IntDivideBuilder);

export class IntDivideBuilder extends OperatorBuilder<[Expression, Expression]> {
    get operator(): string { return "DIV"; }
}
