import {Expression, ExpressionBuilder} from "../../Expression";
import {ExpressionBuildInterface} from "../../ExpressionBuildInterface";

export function Concat<T extends Expression>(expression: T): T;
export function Concat(...expressions: Expression[]): ConcatBuilder;
export function Concat(...expressions: Expression[]): Expression | ConcatBuilder {
    if (expressions.length === 1) return expressions[0];
    return new ConcatBuilder(expressions);
}

export class ConcatBuilder extends ExpressionBuilder {
    constructor(readonly expressions: Expression[]) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        if (eb.driver.config.concatOperator) {
            return this.expressions.map(expression => eb.buildExpression(ctx, expression)).join(" || ");
        } else {
            return `CONCAT(${this.expressions.map(expression => eb.buildExpression(ctx, expression)).join(", ")})`;
        }
    }
}
