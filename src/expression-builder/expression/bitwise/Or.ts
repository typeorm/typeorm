import { OperatorBuilder } from "../Operator";
import { Expression } from "../../Expression";

export class BitwiseOrBuilder extends OperatorBuilder<[Expression, Expression, ...Expression[]]> {
    get operator(): string { return "|"; }
}
