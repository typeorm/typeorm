import {QueryBuilder} from "./QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {ObjectType} from "../common/ObjectType";
import {QueryPartialEntity} from "./QueryPartialEntity";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
import {AbstractSqliteDriver} from "../driver/sqlite-abstract/AbstractSqliteDriver";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class InsertQueryBuilder<Entity> extends QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        let sql = this.createInsertExpression();
        return sql.trim();
    }

    /**
     * Optional returning/output clause.
     */
    output(output: string): this {
         return this.returning(output);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies INTO which entity's table insertion will be executed.
     */
    into<T>(entityTarget: ObjectType<T>|string, columns?: string[]): InsertQueryBuilder<T> {
        const mainAlias = this.createFromAlias(entityTarget);
        this.expressionMap.setMainAlias(mainAlias);
        this.expressionMap.insertColumns = columns || [];
        return (this as any) as InsertQueryBuilder<T>;
    }

    /**
     * Values needs to be inserted into table.
     */
    values(values: QueryPartialEntity<Entity>|QueryPartialEntity<Entity>[]): this {
        this.expressionMap.valuesSet = values;
        return this;
    }

    /**
     * Optional returning/output clause.
     */
    returning(returning: string): this {
        if (this.connection.driver instanceof SqlServerDriver || this.connection.driver instanceof PostgresDriver) {
            this.expressionMap.returning = returning;
            return this;
        } else throw new Error("OUTPUT or RETURNING clause only supported by MS SQLServer or PostgreSQL");
    }

    /**
     * Adds additional ON CONFLICT statement supported in postgres.
     */
    onConflict(statement: string): this {
        this.expressionMap.onConflict = statement;
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates INSERT express used to perform insert query.
     */
    protected createInsertExpression() { // todo: insertion into custom tables wont work because of binding to columns. fix it
        const valueSets = this.getValueSets();
        let values: string, columnNames: string;

        if (this.expressionMap.mainAlias!.hasMetadata) {
            const columns = this.expressionMap.mainAlias!.metadata.columns.filter(column => {
                if (!this.expressionMap.insertColumns.length)
                    return !column.isGenerated;

                return this.expressionMap.insertColumns.indexOf(column.propertyPath) !== -1;
            });

            // get a table name and all column database names
            columnNames = columns.map(column => this.escape(column.databaseName)).join(", ");

            // get values needs to be inserted
            values = valueSets.map((valueSet, insertionIndex) => {
                const columnValues = columns.map(column => {
                    const paramName = "_inserted_" + insertionIndex + "_" + column.databaseName;
                    const value = this.connection.driver.preparePersistentValue(column.getEntityValue(valueSet), column);

                    if (value instanceof Function) { // support for SQL expressions in update query
                        return value();

                    } else if (value === undefined) {
                        if (this.connection.driver instanceof AbstractSqliteDriver) {
                            return "NULL";

                        } else {
                            return "DEFAULT";
                        }

                    } else {
                        if (this.connection.driver instanceof SqlServerDriver) {
                            this.setParameter(paramName, this.connection.driver.parametrizeValue(column, value));
                        } else {
                            this.setParameter(paramName, value);
                        }
                        return ":" + paramName;
                    }
                });
                return "(" + columnValues.join(",") + ")";
            }).join(", ");

        } else { // for tables without metadata

            // get a table name and all column database names
            columnNames = this.expressionMap.insertColumns.join(", ");

            // get values needs to be inserted
            values = valueSets.map((valueSet, insertionIndex) => {
                const columnValues = Object.keys(valueSet).map(columnName => {
                    const paramName = "_inserted_" + insertionIndex + "_" + columnName;
                    const value = valueSet[columnName];

                    if (value instanceof Function) { // support for SQL expressions in update query
                        return value();

                    } else if (value === undefined) {
                        if (this.connection.driver instanceof AbstractSqliteDriver) {
                            return "NULL";

                        } else {
                            return "DEFAULT";
                        }

                    } else {
                        this.setParameter(paramName, value);
                        return ":" + paramName;
                    }
                });
                return "(" + columnValues.join(",") + ")";
            }).join(", ");
        }

        // generate sql query
        if (this.expressionMap.returning !== "" && this.connection.driver instanceof PostgresDriver) {
            return `INSERT INTO ${this.getTableName(this.getMainTableName())}${columnNames ? "(" + columnNames + ")" : ""} VALUES ${values}${this.expressionMap.onConflict ? " ON CONFLICT " + this.expressionMap.onConflict : ""} RETURNING ${this.expressionMap.returning}`;

        } else if (this.expressionMap.returning !== "" && this.connection.driver instanceof SqlServerDriver) {
            return `INSERT INTO ${this.getTableName(this.getMainTableName())}(${columnNames}) OUTPUT ${this.expressionMap.returning} VALUES ${values}`;

        } else {
            return `INSERT INTO ${this.getTableName(this.getMainTableName())}(${columnNames}) VALUES ${values}${this.expressionMap.onConflict ? " ON CONFLICT " + this.expressionMap.onConflict : ""}`;
        }
    }

    /**
     * Gets array of values need to be inserted into the target table.
     */
    protected getValueSets(): ObjectLiteral[] {
        if (this.expressionMap.valuesSet instanceof Array && this.expressionMap.valuesSet.length > 0)
            return this.expressionMap.valuesSet;

        if (this.expressionMap.valuesSet instanceof Object)
            return [this.expressionMap.valuesSet];

        throw new Error(`Cannot perform insert query because values are not defined. Call "qb.values(...)" method to specify inserted values.`);
    }

}
