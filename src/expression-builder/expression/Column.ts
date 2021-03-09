import { ExpressionBuilder } from "../Expression";
import { ExpressionBuildInterface } from "../ExpressionBuildInterface";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Alias} from "../../query-builder/Alias";

export function Col(): ColumnBuilder;
export function Col(column: string | ColumnMetadata): ColumnBuilder;
export function Col(alias: string | Alias, column?: string | ColumnMetadata): ColumnBuilder;
export function Col(aliasOrColumn?: string | Alias | ColumnMetadata, column?: string | ColumnMetadata): ColumnBuilder {
    if (column !== undefined) return new ColumnBuilder(column, aliasOrColumn as (string | Alias));
    return new ColumnBuilder(aliasOrColumn as string | ColumnMetadata);
}

export function c(strings: TemplateStringsArray, ...args: any[]) {
    return Col(strings.map((s, i) => i === args.length ? s : s + args[i]).join(""));
}

export class ColumnBuilder extends ExpressionBuilder {
    constructor(readonly column?: string | ColumnMetadata, readonly alias?: string | Alias) {
        super();
    }

    build = (eb: ExpressionBuildInterface, ctx: any): string => eb.buildColumn(ctx, this.column, this.alias);
}
