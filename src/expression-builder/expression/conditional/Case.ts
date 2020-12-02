import { BuildableExpression, Expression, ExpressionBuilder } from "../../Expression";
import { ExpressionBuildInterface } from "../../ExpressionBuildInterface";

export function Case(value: Expression, ...whensAndElse: (WhenBuildable | ElseBuildable)[]): CaseBuilder;
export function Case(firstWhenOrElse: WhenBuildable | ElseBuildable, ...whensAndElse: (WhenBuildable | ElseBuildable)[]): CaseBuilder;
export function Case(valueOrWhenOrElse: Expression | WhenBuildable | ElseBuildable, ...whensAndElse: (WhenBuildable | ElseBuildable)[]): CaseBuilder {
    // If not comparing to any expression, the WHENs must be equal to TRUE
    if (valueOrWhenOrElse instanceof WhenBuildable || valueOrWhenOrElse instanceof ElseBuildable) {
        whensAndElse.unshift(valueOrWhenOrElse);
        valueOrWhenOrElse = true;
    }

    const whens: WhenBuildable[] = [];
    let def: ElseBuildable | undefined = undefined;

    // TODO: Variadic tuple types, else can be forced as last element
    for (let whenOrElse of whensAndElse) {
        if (whenOrElse instanceof WhenBuildable) {
            whens.push(whenOrElse);
        } else if (def === undefined) {
            def = whenOrElse;
        }
    }

    return new CaseBuilder(valueOrWhenOrElse, whens, def);
}

export function When(when: Expression, then: Expression) {
    return new WhenBuildable(when, then);
}

export function Else(then: Expression) {
    return new ElseBuildable(then);
}

export class CaseBuilder extends ExpressionBuilder {
    constructor(readonly value: Expression, readonly whens: WhenBuildable[], readonly def?: ElseBuildable) {
        super();
    }

    build = (eb: ExpressionBuildInterface, ctx: any): string => {
        const expression: string[] = ["CASE"];
        if (this.value !== true) expression.push(eb.buildExpression(ctx, this.value));
        this.whens.forEach(when => eb.buildExpression(ctx, when));
        if (this.def !== undefined) expression.push(eb.buildExpression(ctx, this.def));
        return expression.join(" ");
    };
}

export class WhenBuildable extends BuildableExpression {
    constructor(readonly when: Expression, readonly then: Expression) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return `WHEN ${eb.buildExpression(ctx, this.when)} THEN ${eb.buildExpression(ctx, this.then)}`;
    }
}

export class ElseBuildable extends BuildableExpression {
    constructor(readonly then: Expression) {
        super();
    }

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return `ELSE ${eb.buildExpression(ctx, this.then)}`;
    }
}
