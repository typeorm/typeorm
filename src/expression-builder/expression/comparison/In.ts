import {Expression, ExpressionBuilder} from "../../Expression";
import {ExpressionBuildInterface} from "../../ExpressionBuildInterface";
import {ColumnComparator} from "../Operator";
import {Col, ColumnBuilder} from "../Column";

export function In(expression: Expression, values: Expression[]): InBuilder;
export function In<T>(values: (T | ExpressionBuilder)[]): InBuilder & ColumnComparator<T>;
export function In(expressionOrValues: Expression | Expression[], maybeValues?: Expression[]): InBuilder {
    let expression: Expression;
    let values: Expression[];
    if (maybeValues === undefined) {
        expression = Col();
        values = expressionOrValues as Expression[];
    } else {
        expression = expressionOrValues as Expression;
        values = maybeValues;
    }

    return new InBuilder(expression, values);
}

export class InBuilder extends ExpressionBuilder {
    constructor(private expression: Expression, private values: Expression[]) {
        super();
    }

    get columnComparator(): boolean {
        return this.expression instanceof ColumnBuilder && this.expression.column === undefined;
    }

    build = (eb: ExpressionBuildInterface, ctx: any): string => {
        if (this.values.length === 0) return "1=0";
        else return `${eb.buildExpression(ctx, this.expression)} IN (${this.values.map(v => eb.buildExpression(ctx, v)).join(", ")})`;
    };

    negate = () => new NotInBuilder(this.expression, this.values);
}

export class NotInBuilder extends ExpressionBuilder {
    constructor(private expression: Expression, private values: Expression[]) {
        super();
    }

    get columnComparator(): boolean {
        return this.expression instanceof ColumnBuilder && this.expression.column === undefined;
    }

    build = (eb: ExpressionBuildInterface, ctx: any): string => {
        if (this.values.length === 0) return "1=1";
        else return `${eb.buildExpression(ctx, this.expression)} NOT IN (${this.values.map(v => eb.buildExpression(ctx, v)).join(", ")})`;
    };

    negate = () => new InBuilder(this.expression, this.values);
}
