import { Expression, ExpressionBuilder } from "../../../Expression";
import { ExpressionBuildInterface } from "../../../ExpressionBuildInterface";

export function UnaryMinus(expression: Expression) {
    return new UnaryMinusBuilder(expression);
}

export class UnaryMinusBuilder extends ExpressionBuilder {
    constructor(readonly expression: Expression) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return `- ${eb.buildExpression(ctx, this.expression)}`;
    }
}
