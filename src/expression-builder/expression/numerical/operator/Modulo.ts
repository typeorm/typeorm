import { OperatorBuilder, OperatorGen } from "../../Operator";
import { Expression } from "../../../Expression";

export const Modulo = OperatorGen(() => ModuloBuilder);

export class ModuloBuilder extends OperatorBuilder<[Expression, Expression]> {
    get operator(): string { return "%"; }
}
