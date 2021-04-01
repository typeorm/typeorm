import {BuildableExpression, Expression, ExpressionBuilder} from "../Expression";
import {ExpressionBuildInterface} from "../ExpressionBuildInterface";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QuantifierBuildable} from "./comparison/quantifier/Quantifier";

export function Conditions(conditions: ObjectLiteral): ConditionsBuilder {
    return new ConditionsBuilder(conditions);
}

export class ConditionsBuilder extends ExpressionBuilder {
    constructor(readonly conditions: ObjectLiteral) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return eb.buildConditions(ctx, this.conditions);
    }
}

export class EnterContextBuildable extends BuildableExpression {
    constructor(readonly context: any, readonly expression: Expression) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return eb.buildExpression(this.context, this.expression);
    }
}

export type ObjectConditions<T> = {
    [K in keyof T]: ObjectConditions<T[K]> | Expression | QuantifierBuildable;
};
