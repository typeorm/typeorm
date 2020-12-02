import { ExpressionBuilder } from "../Expression";
import { ExpressionBuildInterface } from "../ExpressionBuildInterface";

export function Literal(value: any, raw: boolean = false) {
    return new LiteralBuilder(value, raw);
}

export class LiteralBuilder extends ExpressionBuilder {
    constructor(readonly value: any, readonly raw = false) {
        super();
    }

    build = (eb: ExpressionBuildInterface, ctx: any) => eb.buildLiteral(ctx, this.value, this.raw);
}
