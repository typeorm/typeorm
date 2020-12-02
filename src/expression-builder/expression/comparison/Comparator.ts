import {OperatorBuilder, OperatorGen} from "../Operator";
import {Expression} from "../../Expression";
import {ColumnBuilder} from "../Column";
import {QuantifierBuildable} from "./quantifier/Quantifier";

export const ComparatorGen = OperatorGen;

export abstract class ComparatorBuilder extends OperatorBuilder<[Expression, Expression | QuantifierBuildable]> {
    get columnComparator(): boolean {
        return this.operands[0] instanceof ColumnBuilder && this.operands[0].column === undefined;
    }

    get negatedOperands(): [Expression, Expression | QuantifierBuildable] {
        return [this.operands[0], this.operands[1] instanceof QuantifierBuildable ? this.operands[1].negate() : this.operands[1]];
    }
}
