import {Expression, ExpressionBuilder} from "../Expression";
import {ExpressionBuildInterface} from "../ExpressionBuildInterface";
import {Col} from "./Column";

export function OperatorGen<P extends Expression[], O extends OperatorBuilder<P>>(
    builder: () => { new (operands: [Expression, Expression]): O}
): (<T>(expression: T | ExpressionBuilder) => O & ColumnComparator<T>) & ((a: Expression, b: Expression) => O) {
    return ((a: Expression, b?: Expression): O => {
        if (b === undefined) return new (builder())([Col(), a]);
        return new (builder())([a, b]);
    }) as (<T extends Expression>(expression: T) => O & ColumnComparator<T>) & ((a: Expression, b: Expression) => O);
}

export abstract class OperatorBuilder<O extends any[]> extends ExpressionBuilder {
    readonly operands: O;

    constructor(operands: O) {
        super();

        this.operands = operands;
    }

    abstract get operator(): string;

    build(eb: ExpressionBuildInterface, ctx: any): string {
        return this.operands.map(o => {
            const q = eb.buildExpression(ctx, o);
            if (o instanceof OperatorBuilder) return `(${q})`;
            return q;
        }).join(` ${this.operator} `);
    }
}

export const columnComparatorTypeDummySymbol = Symbol();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ColumnComparator<T> = ExpressionBuilder & {
    columnComparator: true;
};

export type NotColumnComparator = ExpressionBuilder & {
    columnComparator: false;
};
