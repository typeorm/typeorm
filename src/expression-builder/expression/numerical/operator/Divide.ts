import { OperatorBuilder, OperatorGen } from "../../Operator";
import { Expression } from "../../../Expression";

export const Divide = OperatorGen(() => DivideBuilder);

export class DivideBuilder extends OperatorBuilder<[Expression, Expression]> {
    get operator(): string { return "/"; }
}
