import {QueryBuilder} from "../query-builder/builder/QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {Driver} from "../driver/Driver";
import {Connection} from "../connection/Connection";
import {Expression} from "./Expression";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {Alias} from "../query-builder/Alias";

export interface ExpressionBuildInterface {
    buildExpression(context: any, expression: Expression): string;

    buildColumn(context: any, column?: string | ColumnMetadata, alias?: string | Alias): string;
    buildLiteral(context: any, literal: Expression, raw?: boolean): string;
    buildRaw(context: any, expression: string, parameters?: ObjectLiteral): string;

    buildConditions(context: any, conditions: ObjectLiteral): string;

    buildSubQuery(context: any, qb: QueryBuilder<any>): string;
    createSubQuery(context: any): QueryBuilder<any>;

    enterAliasContext(context: any, alias: string): any;
    enterPathContext(context: any, path: string): any;

    connection: Connection;
    driver: Driver;
}
