import {QueryBuilder} from "./QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ObjectType} from "../common/ObjectType";
import {QueryPartialEntity} from "./QueryPartialEntity";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";

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
    into<T>(entityTarget: ObjectType<T>|string): InsertQueryBuilder<T> {
        const mainAlias = this.createFromAlias(entityTarget);
        this.expressionMap.setMainAlias(mainAlias);
        return (this as any) as InsertQueryBuilder<T>;
    }

    /**
     * Values needs to be inserted into table.
     */
    values(values: QueryPartialEntity<Entity>): this;

    /**
     * Values needs to be inserted into table.
     */
    values(values: QueryPartialEntity<Entity>[]): this;

    /**
     * Values needs to be inserted into table.
     */
    values(values: ObjectLiteral|ObjectLiteral[]): this {
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

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates INSERT express used to perform insert query.
     */
    protected createInsertExpression() { // todo: insertion into custom tables wont work because of binding to columns. fix it
        const valueSets = this.getValueSets();

        // get columns that participate in insertion query
        const insertColumns: ColumnMetadata[] = [];
        Object.keys(valueSets[0]).forEach(columnProperty => {
            const column = this.expressionMap.mainAlias!.metadata.findColumnWithPropertyName(columnProperty);
            if (column) insertColumns.push(column);
        });

        // get values needs to be inserted
        const values = valueSets.map((valueSet, key) => {
            const columnNames = insertColumns.map(column => {
                const paramName = "_inserted_" + key + "_" + column.databaseName;
                const value = valueSet[column.propertyName];

                if (value instanceof Function) { // support for SQL expressions in update query
                    return value();

                } else {
                    if (this.connection.driver instanceof SqlServerDriver) {
                        this.setParameter(paramName, this.connection.driver.parametrizeValue(column, value));
                    } else {
                        this.setParameter(paramName, value);
                    }
                    return ":" + paramName;
                }
            });
            return "(" + columnNames.join(",") + ")";
        }).join(", ");

        // get a table name and all column database names
        const columnNames = insertColumns.map(column => this.escape(column.databaseName)).join(", ");

        // generate sql query
        if (this.expressionMap.returning !== "" && this.connection.driver instanceof PostgresDriver) {
            return `INSERT INTO ${this.getTableName(this.getMainTableName())}(${columnNames}) VALUES ${values} RETURNING ${this.expressionMap.returning}`;
        } else if (this.expressionMap.returning !== "" && this.connection.driver instanceof SqlServerDriver) {
            return `INSERT INTO ${this.getTableName(this.getMainTableName())}(${columnNames}) OUTPUT ${this.expressionMap.returning} VALUES ${values}`;
        } else {
            return `INSERT INTO ${this.getTableName(this.getMainTableName())}(${columnNames}) VALUES ${values}`;
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
