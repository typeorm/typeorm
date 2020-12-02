import { ExpressionBuilder } from "../Expression";
import { ExpressionBuildInterface } from "../ExpressionBuildInterface";

export function Col(): ColumnBuilder;
export function Col(column: string): ColumnBuilder;
export function Col(alias: string, column?: string): ColumnBuilder;
export function Col(aliasOrColumn?: string, column?: string): ColumnBuilder {
    if (column !== undefined) return new ColumnBuilder(column, aliasOrColumn);
    return new ColumnBuilder(aliasOrColumn);
}

export function c(strings: TemplateStringsArray, ...args: any[]) {
    return Col(strings.map((s, i) => i === args.length ? s : s + args[i]).join(""));
}

export class ColumnBuilder extends ExpressionBuilder {
    constructor(readonly column?: string, readonly alias?: string) {
        super();
    }

    build = (eb: ExpressionBuildInterface, ctx: any): string => eb.buildColumn(ctx, this.column, this.alias);
}
