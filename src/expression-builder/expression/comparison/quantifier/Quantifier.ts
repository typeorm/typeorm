import {BuildableExpression, Expression} from "../../../Expression";
import {ExpressionBuildInterface} from "../../../ExpressionBuildInterface";

export abstract class QuantifierBuildable extends BuildableExpression {
    constructor(readonly values: Expression) {
        super();
    }

    abstract get quantifier(): string;
    abstract negate(): QuantifierBuildable;

    build = (eb: ExpressionBuildInterface, ctx: any): string => `${this.quantifier} (${eb.buildExpression(ctx, this.values)})`;
}
