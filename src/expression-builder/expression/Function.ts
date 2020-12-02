import { Expression, ExpressionBuilder } from "../Expression";
import { ExpressionBuildInterface } from "../ExpressionBuildInterface";

export function Fn(name: string, parameters: Expression[]) {
    return new UserFunctionBuilder(name, parameters);
}

export abstract class FunctionBuilder<P extends Expression[]> extends ExpressionBuilder {
    readonly parameters: P;

    constructor(parameters: P) {
        super();
        this.parameters = parameters;
    }

    abstract get name(): string;

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return `${this.name}(${this.parameters.map(p => eb.buildExpression(ctx, p)).join(", ")})`;
    }
}

export class UserFunctionBuilder extends FunctionBuilder<Expression[]> {
    constructor(readonly name: string, parameters: Expression[]) {
        super(parameters);
    }
}
