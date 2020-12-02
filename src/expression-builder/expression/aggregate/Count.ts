import {BuildableExpression, Expression, ExpressionBuilder} from "../../Expression";
import { ExpressionBuildInterface } from "../../ExpressionBuildInterface";
import {Concat} from "../string/Concat";
import {Raw} from "../Raw";

export function Count(expression: Expression) {
    return new CountBuilder(expression);
}

export function CountDistinct(...expressions: Expression[]) {
    return new CountBuilder(new CountDistinctBuildable(expressions));
}

export class CountBuilder extends ExpressionBuilder {
    constructor(readonly expression: Expression) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return `COUNT(${eb.buildExpression(ctx, this.expression)})`;
    }
}

export class CountDistinctBuildable extends BuildableExpression {
    constructor(readonly expressions: Expression[]) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        // TODO: This could be improved
        let value: string;
        if (!eb.driver.config.countDistinctMultiple) {
            const expressionsWithSeparators = this.expressions.reduce((result, expression, i) => {
                if (i > 0) result.push(Raw("'|;|'"));
                result.push(expression);
                return result;
            }, [] as Expression[]);

            value = eb.buildExpression(ctx, Concat(...expressionsWithSeparators));
        } else {
            value = this.expressions.map(expression => eb.buildExpression(ctx, expression)).join(", ");
        }

        if (eb.driver.config.countDistinctModifier) {
            return `DISTINCT ${value}`;
        } else {
            return `DISTINCT(${value})`;
        }
    }
}
