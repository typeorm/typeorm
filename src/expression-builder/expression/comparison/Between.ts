import {Expression, ExpressionBuilder} from "../../Expression";
import {ExpressionBuildInterface} from "../../ExpressionBuildInterface";
import {Col, ColumnBuilder} from "../Column";
import {ColumnComparator} from "../Operator";

export function Between(expression: Expression, min: Expression, max: Expression): BetweenBuilder;
export function Between<T>(min: T | ExpressionBuilder, max: T | ExpressionBuilder): BetweenBuilder & ColumnComparator<T>;
export function Between(...params: [Expression, Expression] | [Expression, Expression, Expression]): BetweenBuilder {
    if (params.length === 2) return new BetweenBuilder(Col(), ...params);
    return new BetweenBuilder(...params) as BetweenBuilder & {comparator: true};
}

export class BetweenBuilder extends ExpressionBuilder {
    constructor(readonly expression: Expression, readonly min: Expression, readonly max: Expression) {
        super();
    }

    get columnComparator(): boolean {
        return this.expression instanceof ColumnBuilder && this.expression.column === undefined;
    }

    build = (eb: ExpressionBuildInterface, ctx: any): string =>
        `${eb.buildExpression(ctx, this.expression)} BETWEEN ${eb.buildExpression(ctx, this.min)} AND ${eb.buildExpression(ctx, this.max)}`;

    negate = () => new NotBetweenBuilder(this.expression, this.min, this.max);
}

export class NotBetweenBuilder extends ExpressionBuilder {
    constructor(readonly expression: Expression, readonly min: Expression, readonly max: Expression) {
        super();
    }

    get columnComparator(): boolean {
        return this.expression instanceof ColumnBuilder && this.expression.column === undefined;
    }

    build = (eb: ExpressionBuildInterface, ctx: any): string =>
        `${eb.buildExpression(ctx, this.expression)} NOT BETWEEN ${eb.buildExpression(ctx, this.min)} AND ${eb.buildExpression(ctx, this.max)}`;

    negate = () => new BetweenBuilder(this.expression, this.min, this.max);
}
