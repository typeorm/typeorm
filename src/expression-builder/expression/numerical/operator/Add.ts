import { OperatorBuilder, OperatorGen } from "../../Operator";
import { Expression } from "../../../Expression";

export const Add = OperatorGen(() => AddBuilder);
export const Plus = Add;

export class AddBuilder extends OperatorBuilder<[Expression, Expression, ...Expression[]]> {
    get operator(): string { return "+"; }
}
