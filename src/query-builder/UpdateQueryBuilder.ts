import {QueryBuilder} from "./QueryBuilder";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {PostgresDriver} from "../driver/postgres/PostgresDriver";
import {WhereExpression} from "./WhereExpression";
import {Brackets} from "./Brackets";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class UpdateQueryBuilder<Entity> extends QueryBuilder<Entity> implements WhereExpression {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOrQueryBuilder: Connection|QueryBuilder<any>, queryRunner?: QueryRunner) {
        super(connectionOrQueryBuilder as any, queryRunner);
        this.expressionMap.aliasNamePrefixingEnabled = false;
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        let sql = this.createUpdateExpression();
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
     * Values needs to be updated.
     */
    set(values: ObjectLiteral): this {
        this.expressionMap.valuesSet = values;
        return this;
    }

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string|((qb: this) => string)|Brackets, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres = [{ type: "simple", condition: this.computeWhereParameter(where) }];
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string|((qb: this) => string)|Brackets, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({ type: "and", condition: this.computeWhereParameter(where) });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: string|((qb: this) => string)|Brackets, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({ type: "or", condition: this.computeWhereParameter(where) });
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    whereInIds(ids: any|any[]): this {
        ids = ids instanceof Array ? ids : [ids];
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.where(whereExpression, parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    andWhereInIds(ids: any|any[]): this {
        ids = ids instanceof Array ? ids : [ids];
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.andWhere(whereExpression, parameters);
        return this;
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     */
    orWhereInIds(ids: any|any[]): this {
        ids = ids instanceof Array ? ids : [ids];
        const [whereExpression, parameters] = this.createWhereIdsExpression(ids);
        this.orWhere(whereExpression, parameters);
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
     * Creates UPDATE express used to perform insert query.
     */
    protected createUpdateExpression() {
        const valuesSet = this.getValueSets();

        // prepare columns and values to be updated
        const updateColumnAndValues: string[] = [];
        Object.keys(valuesSet).forEach(columnProperty => {
            const column = this.expressionMap.mainAlias!.metadata.findColumnWithPropertyName(columnProperty);
            if (column) {
                const paramName = "_updated_" + column.databaseName;
                const value = valuesSet[column.propertyName];

                if (value instanceof Function) { // support for SQL expressions in update query
                    updateColumnAndValues.push(this.escape(column.databaseName) + " = " + value());
                } else {
                    if (this.connection.driver instanceof SqlServerDriver) {
                        this.setParameter(paramName, this.connection.driver.parametrizeValue(column, value));
                    } else {
                        this.setParameter(paramName, value);
                    }
                    updateColumnAndValues.push(this.escape(column.databaseName) + " = :" + paramName);
                }
            }
        });

        // get a table name and all column database names
        const whereExpression = this.createWhereExpression();

        // generate and return sql update query
        if (this.expressionMap.returning !== "" && this.connection.driver instanceof PostgresDriver) {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")}${whereExpression} RETURNING ${this.expressionMap.returning}`;

        } else if (this.expressionMap.returning !== "" && this.connection.driver instanceof SqlServerDriver) {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")} OUTPUT ${this.expressionMap.returning}${whereExpression}`;

        } else {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")}${whereExpression}`; // todo: how do we replace aliases in where to nothing?
        }
    }

    /**
     * Gets array of values need to be inserted into the target table.
     */
    protected getValueSets(): ObjectLiteral {
        if (this.expressionMap.valuesSet instanceof Object)
            return this.expressionMap.valuesSet;

        throw new Error(`Cannot perform update query because update values are not defined. Call "qb.set(...)" method to specify inserted values.`);
    }

}
