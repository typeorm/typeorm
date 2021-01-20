/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
import {QueryBuilder} from "./QueryBuilder";
import {OracleDriver} from "../../driver/oracle/OracleDriver";
import {SqlServerDriver} from "../../driver/sqlserver/SqlServerDriver";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {ReturningStatementNotSupportedError} from "../../error/ReturningStatementNotSupportedError";
import {RandomGenerator} from "../../util/RandomGenerator";

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
    protected createReturningExpression(): string {
        const columns = this.getReturningColumns();
        const driver = this.connection.driver;

        // Oracle doesn't support returning on multi-row insert
        if (driver instanceof OracleDriver && Array.isArray(this.expressionMap.valuesSet) && this.expressionMap.valuesSet.length > 0) {
            return "";
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
                columnsExpression += " INTO " + columns.map(column => {
                    const parameterName = "output_" + column.databaseName;
                    this.expressionMap.nativeParameters[parameterName] = { type: driver.columnTypeToNativeParameter(column.type), dir: driver.oracle.BIND_OUT };
                    return this.connection.driver.createParameter(parameterName, Object.keys(this.expressionMap.nativeParameters).length);
                }).join(", ");
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

        return "";
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

    /**
     * Creates expression for persisting a column value in INSERT/UPDATE queries.
     */
    protected computePersistValueExpression(column: ColumnMetadata | undefined, value: any, createParamExpression: (value: any, specialName?: string) => string) {
        if (column && !(value instanceof Function))
            value = this.connection.driver.preparePersistentValue(value, column);

        // Special conditions for INSERT/UPDATE only
        if (this.expressionMap.queryType === "insert") {
            if (column && column.isDiscriminator) {
                return createParamExpression(this.expressionMap.mainAlias!.metadata.discriminatorValue, "discriminator");
            }
            // for create and update dates we insert current date
            // no, we don't do it because this constant is already in "default" value of the column
            // with extended timestamp functionality, like CURRENT_TIMESTAMP(6) for example
            // } else if (column.isCreateDate || column.isUpdateDate) {
            //     return "CURRENT_TIMESTAMP";

            // } else if (column.isNestedSetLeft) {
            //     const tableName = this.connection.driver.escape(column.entityMetadata.tablePath);
            //     const rightColumnName = this.connection.driver.escape(column.entityMetadata.nestedSetRightColumn!.databaseName);
            //     const subQuery = `(SELECT c.max + 1 FROM (SELECT MAX(${rightColumnName}) as max from ${tableName}) c)`;
            //     expression += subQuery;
            // } else if (column.isNestedSetRight) {
            //     const tableName = this.connection.driver.escape(column.entityMetadata.tablePath);
            //     const rightColumnName = this.connection.driver.escape(column.entityMetadata.nestedSetRightColumn!.databaseName);
            //     const subQuery = `(SELECT c.max + 2 FROM (SELECT MAX(${rightColumnName}) as max from ${tableName}) c)`;
            //     expression += subQuery;
            // }

            if (value === undefined) {
                if (column && column.isVersion) {
                    // Newly inserted entities are always version 1 (first version) unless user specified
                    return "1";
                } else if (column && column.isGenerated && column.generationStrategy === "uuid" && !this.connection.driver.config.uuidGeneration) {
                    // Generate uuid if database does not support generation and user didn't provide a value
                    return createParamExpression(RandomGenerator.uuid4(), "uuid");
                }

                // If value for this column was not provided then insert default value
                // unfortunately sqlite does not support DEFAULT expression in INSERT queries
                if ((this.connection.driver instanceof OracleDriver && Array.isArray(this.expressionMap.valuesSet) && this.expressionMap.valuesSet.length > 1)
                    || !this.connection.driver.config.insertDefaultValue) {
                    if (column && column.default !== undefined && column.default !== null) { // try to use default defined in the column
                        return this.connection.driver.normalizeDefault(column);
                    } else {
                        return "NULL"; // otherwise simply use NULL and pray if column is nullable
                    }
                } else {
                    return "DEFAULT";
                }
            }
        } else if (this.expressionMap.queryType === "update") {
            if (value === undefined) {
                if (column && column.isVersion) {
                    return `${this.escape(column.databaseName)} + 1`;
                } else if (column && column.isUpdateDate) {
                    return "CURRENT_TIMESTAMP"; // todo: fix issue with CURRENT_TIMESTAMP(6) being used, can "DEFAULT" be used?!
                } else if (column && column.isDeleteDate) {
                    if (this.expressionMap.softDeleteAction === "delete") return "CURRENT_TIMESTAMP";
                    if (this.expressionMap.softDeleteAction === "restore") return "NULL";
                }
            }
        }

        // Raw SQL expression, no further processing
        if (value instanceof Function)
            return String(value());

        // Some drivers require additional type information for parameters
        if (column && this.connection.driver.parametrizeValue)
            value = this.connection.driver.parametrizeValue(column, value);

        const paramExpression = createParamExpression(value);

        // Wrap special columns (spatial types, etc)
        if (column && this.connection.driver.wrapPersistExpression)
            return this.connection.driver.wrapPersistExpression(paramExpression, column);

        return paramExpression;
    }
}
