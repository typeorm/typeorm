import {OperatorBuilder} from "../Operator";
import {ExpressionBuildInterface} from "../../ExpressionBuildInterface";
import {ComparatorBuilder, ComparatorGen} from "./Comparator";

export const ILike = ComparatorGen(() => ILikeBuilder);

export class ILikeBuilder extends ComparatorBuilder {
    get operator(): string { return "ILIKE"; }
    negate = () => new NotILikeBuilder(this.negatedOperands);

    build(eb: ExpressionBuildInterface, ctx: any): string {
        if (eb.driver.config.ilikeOperator) return super.build(eb, ctx);

        // TODO: CRITICAL: Integrate this better?
        return this.operands.map(o => {
            const q = eb.buildExpression(ctx, o);
            if (o instanceof OperatorBuilder) return `(${q})`;
            return q;
        }).map(o => `UPPER(${o})`).join(" LIKE ");
    }
}

export class NotILikeBuilder extends ComparatorBuilder {
    get operator(): string { return "NOT ILIKE"; }
    negate = () => new ILikeBuilder(this.negatedOperands);

    build(eb: ExpressionBuildInterface, ctx: any): string {
        if (eb.driver.config.ilikeOperator) return super.build(eb, ctx);

        // TODO: CRITICAL: Integrate this better?
        return this.operands.map(o => {
            const q = eb.buildExpression(ctx, o);
            if (o instanceof OperatorBuilder) return `(${q})`;
            return q;
        }).map(o => `UPPER(${o})`).join(" NOT LIKE ");
    }
}
