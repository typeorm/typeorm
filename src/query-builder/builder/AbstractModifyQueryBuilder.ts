import {QueryBuilder} from "./QueryBuilder";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Connection} from "../../connection/Connection";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {WhereExpression} from "../WhereExpression";
import {OrderByCondition} from "../../find-options/OrderByCondition";
import {LimitOnUpdateNotSupportedError} from "../../error/LimitOnUpdateNotSupportedError";
import {AbstractPersistQueryBuilder} from "./AbstractPersistQueryBuilder";
import {And} from "../../expression-builder/expression/logical/And";
import { Or } from "../../expression-builder/expression/logical/Or";
import { ExpressionBuilder } from "../../expression-builder/Expression";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 *
 * Abstract query builder for common elements between UPDATE / DELETE
 */
export abstract class AbstractModifyQueryBuilder<Entity, Result> extends AbstractPersistQueryBuilder<Entity, Result> implements WhereExpression {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOrQueryBuilder: Connection|QueryBuilder<any, any>, queryRunner?: QueryRunner) {
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
        return [this.createComment(),
            this.createModificationExpression(),
            this.createOrderByExpression(),
            this.createLimitExpression()]
            .filter(q => q).join(" ");
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string | ExpressionBuilder | ((qb: this) => string) | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        this.expressionMap.where = undefined;
        const condition = this.computeWhereExpression(where);
        if (condition) this.expressionMap.where = condition;
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string | ExpressionBuilder | ((qb: this) => string) | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        const condition = this.computeWhereExpression(where);
        if (condition === undefined) throw new Error(""); // TODO: Critical
        if (this.expressionMap.where !== undefined) this.expressionMap.where = And(this.expressionMap.where, condition);
        else this.expressionMap.where = condition;

        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: string | ExpressionBuilder | ((qb: this) => string) | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        const condition = this.computeWhereExpression(where);
        if (condition === undefined) throw new Error(""); // TODO: Critical
        if (this.expressionMap.where !== undefined) this.expressionMap.where = Or(this.expressionMap.where, condition);
        else this.expressionMap.where = condition;

        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    whereInIds(ids: any|any[]): this {
        return this.where(this.computeWhereIdsExpression(ids));
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    andWhereInIds(ids: any|any[]): this {
        return this.andWhere(this.computeWhereIdsExpression(ids));
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    orWhereInIds(ids: any|any[]): this {
        return this.orWhere(this.computeWhereIdsExpression(ids));
    }

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     *
     * Calling order by without order set will remove all previously set order bys.
     */
    orderBy(): this;

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(sort: string, order?: "ASC"|"DESC", nulls?: "NULLS FIRST"|"NULLS LAST"): this;

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(order: OrderByCondition): this;

    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    orderBy(sort?: string|OrderByCondition, order: "ASC"|"DESC" = "ASC", nulls?: "NULLS FIRST"|"NULLS LAST"): this {
        if (sort) {
            if (sort instanceof Object) {
                this.expressionMap.orderBys = sort as OrderByCondition;
            } else {
                if (nulls) {
                    this.expressionMap.orderBys = { [sort as string]: { order, nulls } };
                } else {
                    this.expressionMap.orderBys = { [sort as string]: order };
                }
            }
        } else {
            this.expressionMap.orderBys = {};
        }
        return this;
    }

    /**
     * Adds ORDER BY condition in the query builder.
     */
    addOrderBy(sort: string, order: "ASC"|"DESC" = "ASC", nulls?: "NULLS FIRST"|"NULLS LAST"): this {
        if (nulls) {
            this.expressionMap.orderBys[sort] = { order, nulls };
        } else {
            this.expressionMap.orderBys[sort] = order;
        }
        return this;
    }

    /**
     * Sets LIMIT - maximum number of rows to be selected.
     */
    limit(limit?: number): this {
        this.expressionMap.limit = limit;
        return this;
    }

    /**
     * Indicates if entity must be updated after update operation.
     * This may produce extra query or use RETURNING / OUTPUT statement (depend on database).
     * Enabled by default.
     */
    whereEntity(entity: Entity|Entity[]): this {
        if (!this.expressionMap.mainAlias!.hasMetadata)
            throw new Error(`.whereEntity method can only be used on queries which update real entity table.`);

        this.expressionMap.where = undefined;
        const entities: Entity[] = Array.isArray(entity) ? entity : [entity];
        const entityIds = entities.map(entity => {
            return this.expressionMap.mainAlias!.metadata.getEntityIdMap(entity);
        });

        if (entityIds.some(id => id === undefined))
            throw new Error(`Provided entity does not have ids set, cannot perform operation.`);

        this.whereInIds(entityIds);

        this.expressionMap.whereEntities = entities;
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates "LIMIT" parts of SQL query.
     */
    protected createLimitExpression(): string | null {
        let limit: number|undefined = this.expressionMap.limit;

        if (limit) {
            if (this.connection.driver.config.limitClauseOnModify) {
                return "LIMIT " + limit;
            } else {
                throw new LimitOnUpdateNotSupportedError();
            }
        }

        return null;
    }

    protected abstract createModificationExpression(): string;
}
