/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
import {QueryBuilder} from "./QueryBuilder";
import {OracleDriver} from "../../driver/oracle/OracleDriver";
import {SqlServerDriver} from "../../driver/sqlserver/SqlServerDriver";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {ReturningStatementNotSupportedError} from "../../error/ReturningStatementNotSupportedError";
import {RandomGenerator} from "../../util/RandomGenerator";
import { Col } from "../../expression-builder/expression/Column";
import { Default } from "../../expression-builder/expression/misc/Default";
import { CurrentTimestamp } from "../../expression-builder/expression/datetime/CurrentTimestamp";
import { Null } from "../../expression-builder/expression/misc/Null";
import { Plus } from "../../expression-builder/expression/numerical/operator/Add";
import {Raw} from "../../expression-builder/expression/Raw";
import {ExpressionBuilder} from "../../expression-builder/Expression";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 *
 * Abstract query builder for common elements between INSERT / UPDATE / DELETE
 */
export abstract class AbstractPersistQueryBuilder<Entity, Result> extends QueryBuilder<Entity, Result> {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Optional returning/output clause.
     * This will return given column values.
     */
    output(columns: string[]): this;

    /**
     * Optional returning/output clause.
     * Returning is a SQL string containing returning statement.
     */
    output(output: string): this;

    /**
     * Optional returning/output clause.
     */
    output(output: string|string[]): this;

    /**
     * Optional returning/output clause.
     */
    output(output: string|string[]): this {
        return this.returning(output);
    }

    /**
     * Optional returning/output clause.
     * This will return given column values.
     */
    returning(columns: string[]): this;

    /**
     * Optional returning/output clause.
     * Returning is a SQL string containing returning statement.
     */
    returning(returning: string): this;

    /**
     * Optional returning/output clause.
     */
    returning(returning: string|string[]): this;

    /**
     * Optional returning/output clause.
     */
    returning(returning: string|string[]): this {

        // not all databases support returning/output cause
        if (!this.connection.driver.config.returningClause)
            throw new ReturningStatementNotSupportedError();

        this.expressionMap.returning = returning;
        return this;
    }

    /**
     * Indicates if entity must be updated after query completes.
     * This may produce extra query or use RETURNING / OUTPUT statement (depend on database).
     * Enabled by default.
     */
    updateEntity(enabled: boolean): this {
        this.expressionMap.updateEntity = enabled;
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates "RETURNING" / "OUTPUT" expression.
     */
    protected createReturningExpression(): string | null {
        const columns = this.getReturningColumns();
        const driver = this.connection.driver;

        // Oracle doesn't support returning on multi-row insert
        if (driver instanceof OracleDriver && Array.isArray(this.expressionMap.valuesSet) && this.expressionMap.valuesSet.length > 0) {
            return null;
        }

        // also add columns we must auto-return to perform entity updation
        // if user gave his own returning
        if (typeof this.expressionMap.returning !== "string" &&
            this.expressionMap.extraReturningColumns.length > 0 &&
            driver.config.returningClause) {
            columns.push(...this.expressionMap.extraReturningColumns.filter(column => {
                return columns.indexOf(column) === -1;
            }));
        }

        if (columns.length) {
            let columnsExpression = columns.map(column => {
                const name = this.escape(column.databaseName);
                if (driver instanceof SqlServerDriver) {
                    if (this.expressionMap.queryType === "insert" || this.expressionMap.queryType === "update") {
                        return "INSERTED." + name;
                    } else {
                        return this.escape(this.getMainTableName()) + "." + name;
                    }
                } else {
                    return name;
                }
            }).join(", ");

            if (driver instanceof OracleDriver) {
                columnsExpression += " INTO " + columns.map(column =>
                    this.buildNativeParameter({ type: driver.columnTypeToNativeParameter(column.type), dir: driver.oracle.BIND_OUT })).join(", ");
            }

            if (driver instanceof SqlServerDriver) {
                if (this.expressionMap.queryType === "insert" || this.expressionMap.queryType === "update") {
                    columnsExpression += " INTO @OutputTable";
                }
            }

            return columnsExpression;

        } else if (typeof this.expressionMap.returning === "string") {
            return this.expressionMap.returning;
        }

        return null;
    }

    /**
     * If returning / output cause is set to array of column names,
     * then this method will return all column metadatas of those column names.
     */
    protected getReturningColumns(): ColumnMetadata[] {
        const columns: ColumnMetadata[] = [];
        if (Array.isArray(this.expressionMap.returning)) {
            (this.expressionMap.returning as string[]).forEach(columnName => {
                if (this.expressionMap.mainAlias!.hasMetadata) {
                    columns.push(...this.expressionMap.mainAlias!.metadata.findColumnsWithPropertyPath(columnName));
                }
            });
        }
        return columns;
    }

    protected preparePersistValue(column: ColumnMetadata | undefined, value: any) {
        if (column && !(value instanceof Function))
            value = this.connection.driver.prepareSqlValue(value, column);

        // Special conditions for INSERT/UPDATE only
        if (this.expressionMap.queryType === "insert") {
            if (column && column.isDiscriminator) {
                return this.expressionMap.mainAlias!.metadata.discriminatorValue;
            }

            if (value === undefined) {
                if (column && column.isVersion) {
                    // Newly inserted entities are always version 1 (first version) unless user specified
                    return 1;
                } else if (column && column.isGenerated && column.generationStrategy === "uuid" && !this.connection.driver.config.uuidGeneration) {
                    // Generate uuid if database does not support generation and user didn't provide a value
                    return RandomGenerator.uuid4();
                }

                // Insert default value for column if not provided, except on drivers that don't support DEFAULT
                if ((this.connection.driver instanceof OracleDriver && Array.isArray(this.expressionMap.valuesSet) && this.expressionMap.valuesSet.length > 1)
                    || !this.connection.driver.config.insertDefaultValue) {
                    // Try to use column default value, otherwise return null and hope that column is nullable
                    // TODO: CRITICAL: Don't use Raw?
                    return column && column.default !== undefined && column.default !== null ? Raw(this.connection.driver.normalizeDefault(column) ?? "NULL") : null;
                } else {
                    return Default();
                }
            }
        } else if (this.expressionMap.queryType === "update") {
            if (value === undefined) {
                if (column && column.isVersion) {
                    return Plus(Col(), 1);
                } else if (column && column.isUpdateDate) {
                    return CurrentTimestamp(); // todo: fix issue with CURRENT_TIMESTAMP(6) being used, can "DEFAULT" be used?!
                } else if (column && column.isDeleteDate) {
                    if (this.expressionMap.softDeleteAction === "delete") return CurrentTimestamp();
                    if (this.expressionMap.softDeleteAction === "restore") return Null();
                }
            }
        }

        return value;
    }

    /**
     * Creates expression for persisting a column value in INSERT/UPDATE queries.
     */
    protected computePersistValueExpression(columnOrKey: ColumnMetadata | string, value: any) {
        const column = columnOrKey instanceof ColumnMetadata ? columnOrKey : undefined;
        value = this.preparePersistValue(column, value);

        // Raw SQL expression, no further processing
        if (value instanceof Function)
            value = Raw(value());

        const expression = this.buildExpression(this.createExpressionContext(column), value, true);

        // Wrap special columns (spatial types, etc)
        if (!(value instanceof ExpressionBuilder) && column && this.connection.driver.wrapPersistExpression)
            return this.connection.driver.wrapPersistExpression(expression, column);

        return expression;
    }
}
