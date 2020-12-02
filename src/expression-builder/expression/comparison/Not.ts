import { Expression, ExpressionBuilder } from "../../Expression";
import { FunctionBuilder } from "../Function";
import { NotEqual, NotEqualBuilder } from "./Equal";
import {QuantifierBuildable} from "./quantifier/Quantifier";
import { IsNotNull } from "./IsNot";
import {ColumnComparator} from "../Operator";

export function Not<T>(expression: T): NotEqualBuilder & ColumnComparator<T>;
export function Not<T extends QuantifierBuildable>(quantifier: T): NotEqualBuilder;
export function Not<T extends ExpressionBuilder>(builder: T): T["negate"] extends () => infer R ? R : NotBuilder<T>;
export function Not<T extends Expression | QuantifierBuildable>(expression: T): Expression {
    if (expression instanceof ExpressionBuilder) {
        if (expression.negate !== undefined) return expression.negate();
        else return new NotBuilder([expression]);
    }

    if (expression instanceof QuantifierBuildable) return NotEqual(expression.negate());
    if (expression === null) return IsNotNull();
    return NotEqual(expression);
}

export class NotBuilder<T extends Expression> extends FunctionBuilder<[T]> {
    get name() { return "NOT"; }
    negate = () => this.parameters[0];
}
