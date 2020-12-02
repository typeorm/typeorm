import {Expression, ExpressionBuilder} from "../../Expression";
import {ExpressionBuildInterface} from "../../ExpressionBuildInterface";

export function Cast(value: Expression, as: string): CastBuilder {
    return new CastBuilder(value, as);
}

export class CastBuilder extends ExpressionBuilder {
    constructor(
        readonly value: Expression,
        readonly as: string
    ) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return `CAST(${eb.buildExpression(ctx, this.value)} as ${this.as})`;
    }
}
