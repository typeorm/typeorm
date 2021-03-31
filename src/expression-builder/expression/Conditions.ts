import {BuildableExpression, Expression, ExpressionBuilder} from "../Expression";
import {ExpressionBuildInterface} from "../ExpressionBuildInterface";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {And, AndBuilder} from "./logical/And";
import {Equal} from "./comparison/Equal";
import {QuantifierBuildable} from "./comparison/quantifier/Quantifier";

export function Conditions(conditions: ObjectLiteral): AndBuilder | ExpressionBuilder {
    /*const mapped = Object.entries(conditions).map(([key, value]): [string, Expression] => {
        if (value === undefined) return [key, undefined];
        if (isPlainObjectConditions(value)) return [key, Conditions(value)];
        if (value instanceof ExpressionBuilder) return [key, value.columnComparator ? value : Equal(value)];
        if (key === "aliases") return [key, ConditionsAliases(value)];
        return [key, value === null ? IsNull() : Equal(value)];
    }).filter(([, value]) => value !== undefined).map(([key, value]) => new EnterPathBuildable(key, value));

    //if (mapped.length === 0) throw new Error(""); // TODO: CRITICAL
    if (mapped.length === 0) return Equal(1, 1);

    return And(...mapped);*/
    return new ConditionsBuilder(conditions);
}

export function ConditionsAliases(object: ObjectLiteral): AndBuilder | ExpressionBuilder {
    const mapped = Object.entries(object).map(([key, value]) => new EnterAliasBuildable(key, value));

    //if (mapped.length === 0) throw new Error(""); // TODO: CRITICAL
    if (mapped.length === 0) return Equal(1, 1);

    return And(...mapped);
}

export class ConditionsBuilder extends ExpressionBuilder {
    constructor(readonly conditions: ObjectLiteral) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return eb.buildConditions(ctx, this.conditions);
    }
}

export class EnterAliasBuildable extends BuildableExpression {
    constructor(readonly alias: string, readonly expression: Expression) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return eb.buildExpression(eb.enterAliasContext(ctx, this.alias), this.expression);
    }
}

export class EnterPathBuildable extends BuildableExpression {
    constructor(readonly path: string, readonly expression: Expression) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return eb.buildExpression(eb.enterPathContext(ctx, this.path), this.expression);
    }
}

export type ObjectConditions<T> = {
    [K in keyof T]: ObjectConditions<T[K]> | Expression | QuantifierBuildable;
};
