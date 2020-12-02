import {ExpressionBuilder} from "../Expression";
import {ExpressionBuildInterface} from "../ExpressionBuildInterface";
import {Not} from "./comparison/Not";

// TODO: CRITICAL: Rename
export function ForcedColumnComparator(expression: ExpressionBuilder): ForcedColumnComparatorBuilder {
    return new ForcedColumnComparatorBuilder(expression);
}

export class ForcedColumnComparatorBuilder extends ExpressionBuilder {
    constructor(readonly expression: ExpressionBuilder) {
        super();
    }

    get columnComparator() { return true; };

    negate = () => new ForcedColumnComparatorBuilder(Not(this.expression));

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return eb.buildExpression(ctx, this.expression);
    }
}
