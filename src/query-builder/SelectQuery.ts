import { Expression, ExpressionBuilder } from "../expression-builder/Expression";
import { ColumnMetadata } from "../metadata/ColumnMetadata";
import { Alias } from "./Alias";

export interface SelectQuery {
    selection?: string | ExpressionBuilder;
    alias?: string;

    expression?: Expression;
    target?: Alias;
    column?: ColumnMetadata;
    internal?: boolean;
}
