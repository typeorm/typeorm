import { QueryBuilder, SelectQueryBuilder } from '@typeorm/core';
import { BIND_OUT } from 'oracledb';

export abstract class OracleQueryBuilder<Entity> extends QueryBuilder<Entity> {
    SelectQueryBuilderCls = OracleSelectQueryBuilder;

    /**
     * Creates "RETURNING" / "OUTPUT" expression.
     */
    protected createReturningExpression(): string {
        const columns = this.getReturningColumns();
        const driver = this.connection.driver;

        // also add columns we must auto-return to perform entity update
        // if user gave his own returning
        if (typeof this.expressionMap.returning !== "string" &&
            this.expressionMap.extraReturningColumns.length > 0 &&
            driver.isReturningSqlSupported()) {
            columns.push(...this.expressionMap.extraReturningColumns.filter(column => {
                return columns.indexOf(column) === -1;
            }));
        }

        if (columns.length) {
            let columnsExpression = columns.map(column => this.escape(column.databaseName)).join(", ");

            columnsExpression += " INTO " + columns.map(column => {
                const parameterName = "output_" + column.databaseName;
                this.expressionMap.nativeParameters[parameterName] = {
                    type: driver.columnTypeToNativeParameter(column.type),
                    dir: BIND_OUT
                };
                return this.connection.driver.createParameter(parameterName, Object.keys(this.expressionMap.nativeParameters).length);
            }).join(", ");

            return columnsExpression;

        } else if (typeof this.expressionMap.returning === "string") {
            return this.expressionMap.returning;
        }

        return "";
    }

}

export class OracleSelectQueryBuilder<Entity> extends SelectQueryBuilder<Entity> {

}
