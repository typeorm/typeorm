import { OperatorBuilder } from "../Operator";
import { Expression } from "../../Expression";

export class BitwiseXorBuilder extends OperatorBuilder<[Expression, Expression, ...Expression[]]> {
    get operator(): string { return "^"; }
}
