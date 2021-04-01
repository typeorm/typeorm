import {RawSqlResultsToEntityTransformer} from "../transformer/RawSqlResultsToEntityTransformer";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {SqlServerDriver} from "../../driver/sqlserver/SqlServerDriver";
import {PessimisticLockTransactionRequiredError} from "../../error/PessimisticLockTransactionRequiredError";
import {NoVersionOrUpdateDateColumnError} from "../../error/NoVersionOrUpdateDateColumnError";
import {OptimisticLockVersionMismatchError} from "../../error/OptimisticLockVersionMismatchError";
import {OptimisticLockCanNotBeUsedError} from "../../error/OptimisticLockCanNotBeUsedError";
import {JoinAttribute} from "../JoinAttribute";
import {RelationIdAttribute} from "../relation-id/RelationIdAttribute";
import {RelationCountAttribute} from "../relation-count/RelationCountAttribute";
import {RelationIdLoader} from "../relation-id/RelationIdLoader";
import {RelationIdMetadataToAttributeTransformer} from "../relation-id/RelationIdMetadataToAttributeTransformer";
import {RelationCountLoader} from "../relation-count/RelationCountLoader";
import {RelationCountMetadataToAttributeTransformer} from "../relation-count/RelationCountMetadataToAttributeTransformer";
import {QueryBuilder} from "./QueryBuilder";
import {ReadStream} from "../../platform/PlatformTools";
import {LockNotSupportedOnGivenDriverError} from "../../error/LockNotSupportedOnGivenDriverError";
import {SelectQuery} from "../SelectQuery";
import {OrderByCondition} from "../../find-options/OrderByCondition";
import {QueryExpressionMap} from "../QueryExpressionMap";
import {EntityTarget} from "../../common/EntityTarget";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {WhereExpression} from "../WhereExpression";
import {Brackets} from "../Brackets";
import {QueryResultCacheOptions} from "../../cache/QueryResultCacheOptions";
import {BroadcasterResult} from "../../subscriber/BroadcasterResult";
import {SelectQueryBuilderOption} from "../SelectQueryBuilderOption";
import {DriverUtils} from "../../driver/DriverUtils";
import {EntityNotFoundError} from "../../error/EntityNotFoundError";
import { Expression, ExpressionBuilder } from "../../expression-builder/Expression";
import { And } from "../../expression-builder/expression/logical/And";
import { Or } from "../../expression-builder/expression/logical/Or";
import { Equal } from "../../expression-builder/expression/comparison/Equal";
import { Col } from "../../expression-builder/expression/Column";
import { Raw } from "../../expression-builder/expression/Raw";
import {SubQuery} from "../../expression-builder/expression/SubQuery";
import { Count, CountDistinct } from "../../expression-builder/expression/aggregate/Count";
import { QueryBuilderUtils } from "../QueryBuilderUtils";
import {IsNull} from "../../expression-builder/expression/comparison/Is";

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class SelectQueryBuilder<Entity> extends QueryBuilder<Entity, { entities: Entity[], raw: any[], count?: number } | any> implements WhereExpression {

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(resetParameters: boolean = true): string {
        if (resetParameters) this.expressionMap.nativeParameters = [];
        let sql = [this.createComment(),
            this.createSelectExpression(),
            this.createJoinExpression(),
            this.createWhereExpression(),
            this.createGroupByExpression(),
            this.createHavingExpression(),
            this.createOrderByExpression(),
            this.createLimitOffsetExpression(),
            this.createLockExpression()]
            .filter(q => q).join(" ");
        if (this.expressionMap.subQuery)
            sql = `(${sql})`;
        return sql;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates SELECT query.
     * Replaces all previous selections if they exist.
     */
    select(): this;

    /**
     * Creates SELECT query.
     * Replaces all previous selections if they exist.
     *
     * @deprecated Use SubQuery() expression builder
     */
    select(selection: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, selectionAliasName?: string): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string | ExpressionBuilder, selectionAliasName?: string): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: (string | ExpressionBuilder)[]): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection?: string | ExpressionBuilder | (string | ExpressionBuilder)[] | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), selectionAliasName?: string): SelectQueryBuilder<Entity> {
        this.expressionMap.queryType = "select";

        // TODO: Deprecated, remove, use SubQuery() directly
        if (selection instanceof Function)
            selection = SubQuery(selection);

        if (Array.isArray(selection)) {
            this.expressionMap.selects = selection.map(selection => ({ selection: selection }));
        } else if (selection) {
            this.expressionMap.selects = [{ selection: selection, alias: selectionAliasName }];
        }

        return this;
    }

    /**
     * Adds new selection to the SELECT query.
     *
     * @deprecated Use SubQuery() expression builder
     */
    addSelect(selection: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, selectionAliasName?: string): this;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string | ExpressionBuilder, selectionAliasName?: string): this;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: (string | ExpressionBuilder)[]): this;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string | ExpressionBuilder | (string | ExpressionBuilder)[] | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), selectionAliasName?: string): this {
        if (!selection) return this;

        // TODO: Deprecated, remove, use SubQuery() directly
        if (selection instanceof Function)
            selection = SubQuery(selection);

        if (Array.isArray(selection)) {
            this.expressionMap.selects.push(...selection.map(selection => ({ selection: selection })));
        } else if (selection) {
            this.expressionMap.selects.push({ selection: selection, alias: selectionAliasName });
        }

        return this;
    }

    /**
     * Sets whether the selection is DISTINCT.
     */
    distinct(distinct: boolean = true): this {
        this.expressionMap.selectDistinct = distinct;
        return this;
    }

    /**
     * Sets the distinct on clause for Postgres.
     */
    distinctOn(distinctOn: (string | ExpressionBuilder)[]): this {
        this.expressionMap.selectDistinctOn = distinctOn.map(distinct => typeof distinct === "string" ? Raw(distinct) : distinct);
        return this;
    }

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     * Removes all previously set from-s.
     */
    from<T>(entityTarget: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, aliasName: string): SelectQueryBuilder<T>;

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     * Removes all previously set from-s.
     */
    from<T>(entityTarget: EntityTarget<T>, aliasName: string): SelectQueryBuilder<T>;

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     * Removes all previously set from-s.
     */
    from<T>(entityTarget: EntityTarget<T>|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName: string): SelectQueryBuilder<T> {
        const mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return (this as any) as SelectQueryBuilder<T>;
    }

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    addFrom<T>(entityTarget: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, aliasName: string): SelectQueryBuilder<T>;

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    addFrom<T>(entityTarget: EntityTarget<T>, aliasName: string): SelectQueryBuilder<T>;

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    addFrom<T>(entityTarget: EntityTarget<T>|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName: string): SelectQueryBuilder<T> {
        const alias = this.createFromAlias(entityTarget, aliasName);
        if (!this.expressionMap.mainAlias)
            this.expressionMap.setMainAlias(alias);

        return (this as any) as SelectQueryBuilder<T>;
    }

    /**
     * INNER JOINs (without selection) given subquery.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string | ExpressionBuilder, condition?: string, parameters?: ObjectLiteral): this;
    innerJoin(property: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoin(entity: Function|string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoin(tableName: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoin(entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this {
        this.join("INNER", entityOrProperty, alias, condition, parameters);
        return this;
    }

    /**
     * LEFT JOINs (without selection) given subquery.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string | ExpressionBuilder, condition?: string, parameters?: ObjectLiteral): this;
    leftJoin(property: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    leftJoin(entity: Function|string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    leftJoin(tableName: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    leftJoin(entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this {
        this.join("LEFT", entityOrProperty, alias, condition, parameters);
        return this;
    }

    /**
     * INNER JOINs given subquery and adds all selection properties to SELECT..
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndSelect(property: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndSelect(entity: Function|string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndSelect(tableName: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndSelect(entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        this.innerJoin(entityOrProperty, alias, condition, parameters);
        return this;
    }

    /**
     * LEFT JOINs given subquery and adds all selection properties to SELECT..
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string | ExpressionBuilder, condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndSelect(property: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    leftJoinAndSelect(entity: Function|string, alias: string, condition: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    leftJoinAndSelect(tableName: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    leftJoinAndSelect(entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        this.leftJoin(entityOrProperty, alias, condition, parameters);
        return this;
    }

    /**
     * INNER JOINs given subquery, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndMapMany(mapToProperty: string, property: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndMapMany(mapToProperty: string, entity: Function|string, alias: string, condition: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndMapMany(mapToProperty: string, tableName: string, alias: string, condition: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndMapMany(mapToProperty: string, entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        this.join("INNER", entityOrProperty, alias, condition, parameters, mapToProperty, true);
        return this;
    }

    /**
     * INNER JOINs given subquery, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndMapOne(mapToProperty: string, property: string, alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndMapOne(mapToProperty: string, entity: Function|string, alias: string, condition: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndMapOne(mapToProperty: string, tableName: string, alias: string, condition: string | ExpressionBuilder, parameters?: ObjectLiteral): this;
    innerJoinAndMapOne(mapToProperty: string, entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        this.join("INNER", entityOrProperty, alias, condition, parameters, mapToProperty, false);
        return this;
    }

    /**
     * LEFT JOINs given subquery, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapMany(mapToProperty: string, property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapMany(mapToProperty: string, entity: Function|string, alias: string, condition: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapMany(mapToProperty: string, tableName: string, alias: string, condition: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapMany(mapToProperty: string, entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        this.join("LEFT", entityOrProperty, alias, condition, parameters, mapToProperty, true);
        return this;
    }

    /**
     * LEFT JOINs given subquery, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapOne(mapToProperty: string, property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapOne(mapToProperty: string, entity: Function|string, alias: string, condition: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapOne(mapToProperty: string, tableName: string, alias: string, condition: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapOne(mapToProperty: string, entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition?: string | ExpressionBuilder, parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        this.join("LEFT", entityOrProperty, alias, condition, parameters, mapToProperty, false);
        return this;
    }

    /**
     */
    // selectAndMap(mapToProperty: string, property: string, aliasName: string, qbFactory: ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>)): this;
    // selectAndMap(mapToProperty: string, entity: Function|string, aliasName: string, qbFactory: ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>)): this;
    // selectAndMap(mapToProperty: string, tableName: string, aliasName: string, qbFactory: ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>)): this;
    // selectAndMap(mapToProperty: string, entityOrProperty: Function|string, aliasName: string, qbFactory: ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>)): this {
    //     const select = new SelectAttribute(this.expressionMap);
    //     select.mapToProperty = mapToProperty;
    //     select.entityOrProperty = entityOrProperty;
    //     select.aliasName = aliasName;
    //     select.qbFactory = qbFactory;
    //     return this;
    // }

    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationIdAndMap(mapToProperty: string, relationName: string, options?: { disableMixedMap?: boolean }): this;

    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationIdAndMap(mapToProperty: string, relationName: string, alias: string, queryBuilderFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): this;

    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationIdAndMap(mapToProperty: string,
                         relationName: string,
                         aliasNameOrOptions?: string|{ disableMixedMap?: boolean },
                         queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): this {

        const relationIdAttribute = new RelationIdAttribute(this.expressionMap);
        relationIdAttribute.mapToProperty = mapToProperty;
        relationIdAttribute.relationName = relationName;
        if (typeof aliasNameOrOptions === "string")
            relationIdAttribute.alias = aliasNameOrOptions;
        if (aliasNameOrOptions instanceof Object && (aliasNameOrOptions as any).disableMixedMap)
            relationIdAttribute.disableMixedMap = true;

        relationIdAttribute.queryBuilderFactory = queryBuilderFactory;
        this.expressionMap.relationIdAttributes.push(relationIdAttribute);

        /*if (relationIdAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                type: "other",
                name: relationIdAttribute.junctionAlias,
                metadata: relationIdAttribute.relation.junctionEntityMetadata
            });
        }*/
        return this;
    }

    /**
     * Counts number of entities of entity's relation and maps the value into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    loadRelationCountAndMap(mapToProperty: string, relationName: string, aliasName?: string, queryBuilderFactory?: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>): this {
        const relationCountAttribute = new RelationCountAttribute(this.expressionMap);
        relationCountAttribute.mapToProperty = mapToProperty;
        relationCountAttribute.relationName = relationName;
        relationCountAttribute.alias = aliasName;
        relationCountAttribute.queryBuilderFactory = queryBuilderFactory;
        this.expressionMap.relationCountAttributes.push(relationCountAttribute);

        /*this.expressionMap.createAlias({
            type: "other",
            name: relationCountAttribute.junctionAlias
        });
        if (relationCountAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                type: "other",
                name: relationCountAttribute.junctionAlias,
                metadata: relationCountAttribute.relation.junctionEntityMetadata
            });
        }*/
        return this;
    }

    /**
     * Loads all relation ids for all relations of the selected entity.
     * All relation ids will be mapped to relation property themself.
     * If array of strings is given then loads only relation ids of the given properties.
     */
    loadAllRelationIds(options?: { relations?: string[], disableMixedMap?: boolean }): this { // todo: add skip relations
        this.expressionMap.mainAlias!.metadata.relations.forEach(relation => {
            if (options !== undefined && options.relations !== undefined && options.relations.indexOf(relation.propertyPath) === -1)
                return;

            this.loadRelationIdAndMap(
                this.expressionMap.mainAlias!.name + "." + relation.propertyPath,
                this.expressionMap.mainAlias!.name + "." + relation.propertyPath,
                options
            );
        });
        return this;
    }

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string | ExpressionBuilder | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
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
    andWhere(where: string | ExpressionBuilder | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
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
    orWhere(where: string | ExpressionBuilder | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
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
     * Sets HAVING condition in the query builder.
     * If you had previously HAVING expression defined,
     * calling this function will override previously set HAVING conditions.
     * Additionally you can add parameters used in having expression.
     */
    having(having: string | ExpressionBuilder | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        this.expressionMap.having = undefined;
        const condition = this.computeWhereExpression(having);
        if (condition) this.expressionMap.having = condition;
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND HAVING condition in the query builder.
     * Additionally you can add parameters used in having expression.
     */
    andHaving(having: string | ExpressionBuilder | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        const condition = this.computeWhereExpression(having);
        if (condition === undefined) throw new Error(""); // TODO: Critical
        if (this.expressionMap.having !== undefined) this.expressionMap.having = And(this.expressionMap.having, condition);
        else this.expressionMap.having = condition;

        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR HAVING condition in the query builder.
     * Additionally you can add parameters used in having expression.
     */
    orHaving(having: string | ExpressionBuilder | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        const condition = this.computeWhereExpression(having);
        if (condition === undefined) throw new Error(""); // TODO: Critical
        if (this.expressionMap.having !== undefined) this.expressionMap.having = Or(this.expressionMap.having, condition);
        else this.expressionMap.having = condition;

        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Sets GROUP BY condition in the query builder.
     * If you had previously GROUP BY expression defined,
     * calling this function will override previously set GROUP BY conditions.
     */
    groupBy(): this;

    /**
     * Sets GROUP BY condition in the query builder.
     * If you had previously GROUP BY expression defined,
     * calling this function will override previously set GROUP BY conditions.
     */
    groupBy(groupBy: string): this;

    /**
     * Sets GROUP BY condition in the query builder.
     * If you had previously GROUP BY expression defined,
     * calling this function will override previously set GROUP BY conditions.
     */
    groupBy(groupBy?: string | ExpressionBuilder): this {
        if (groupBy) {
            this.expressionMap.groupBys = [typeof groupBy === "string" ? Raw(groupBy) : groupBy];
        } else {
            this.expressionMap.groupBys = [];
        }
        return this;
    }

    /**
     * Adds GROUP BY condition in the query builder.
     */
    addGroupBy(groupBy: string | ExpressionBuilder): this {
        this.expressionMap.groupBys.push(typeof groupBy === "string" ? Raw(groupBy) : groupBy);
        return this;
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
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            throw new Error(`SelectQueryBuilder.addOrderBy "order" can accept only "ASC" and "DESC" values.`);
        if (nulls !== undefined && nulls !== "NULLS FIRST" && nulls !== "NULLS LAST")
            throw new Error(`SelectQueryBuilder.addOrderBy "nulls" can accept only "NULLS FIRST" and "NULLS LAST" values.`);

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
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            throw new Error(`SelectQueryBuilder.addOrderBy "order" can accept only "ASC" and "DESC" values.`);
        if (nulls !== undefined && nulls !== "NULLS FIRST" && nulls !== "NULLS LAST")
            throw new Error(`SelectQueryBuilder.addOrderBy "nulls" can accept only "NULLS FIRST" and "NULLS LAST" values.`);

        if (nulls) {
            this.expressionMap.orderBys[sort] = { order, nulls };
        } else {
            this.expressionMap.orderBys[sort] = order;
        }
        return this;
    }

    /**
     * Set's LIMIT - maximum number of rows to be selected.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead take method instead.
     */
    limit(limit?: number): this {
        this.expressionMap.limit = this.normalizeNumber(limit);
        if (this.expressionMap.limit !== undefined && isNaN(this.expressionMap.limit))
            throw new Error(`Provided "limit" value is not a number. Please provide a numeric value.`);

        return this;
    }

    /**
     * Set's OFFSET - selection offset.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead skip method instead.
     */
    offset(offset?: number): this {
        this.expressionMap.offset = this.normalizeNumber(offset);
        if (this.expressionMap.offset !== undefined && isNaN(this.expressionMap.offset))
            throw new Error(`Provided "offset" value is not a number. Please provide a numeric value.`);

        return this;
    }

    /**
     * Sets maximal number of entities to take.
     */
    take(take?: number): this {
        this.expressionMap.take = this.normalizeNumber(take);
        if (this.expressionMap.take !== undefined && isNaN(this.expressionMap.take))
            throw new Error(`Provided "take" value is not a number. Please provide a numeric value.`);

        return this;
    }

    /**
     * Sets number of entities to skip.
     */
    skip(skip?: number): this {
        this.expressionMap.skip = this.normalizeNumber(skip);
        if (this.expressionMap.skip !== undefined && isNaN(this.expressionMap.skip))
            throw new Error(`Provided "skip" value is not a number. Please provide a numeric value.`);

        return this;
    }

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "optimistic", lockVersion: number | Date): this;

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "pessimistic_read"|"pessimistic_write"|"dirty_read"|"pessimistic_partial_write"|"pessimistic_write_or_fail"|"for_no_key_update", lockVersion?: undefined, lockTables?: string[]): this;

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "optimistic"|"pessimistic_read"|"pessimistic_write"|"dirty_read"|"pessimistic_partial_write"|"pessimistic_write_or_fail"|"for_no_key_update", lockVersion?: number|Date, lockTables?: string[]): this {
        this.expressionMap.lockMode = lockMode;
        this.expressionMap.lockVersion = lockVersion;
        this.expressionMap.lockTables = lockTables;
        return this;
    }

    /**
     * Disables the global condition of "non-deleted" for the entity with delete date columns.
     */
    withDeleted(): this {
        this.expressionMap.withDeleted = true;
        return this;
    }

    /**
     * Gets first raw result returned by execution of generated query builder sql.
     */
    async getRawOne<T = any>(): Promise<T> {
        return (await this.getRawMany())[0];
    }

    /**
     * Gets all raw results returned by execution of generated query builder sql.
     */
    async getRawMany<T = any>(): Promise<T[]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        this.expressionMap.queryEntity = false;
        return await this.execute();
    }

    /**
     * Gets single entity returned by execution of generated query builder sql.
     */
    async getOne(): Promise<Entity|undefined> {
        const results = await this.getRawAndEntities();
        const result = results.entities[0] as any;

        if (result && this.expressionMap.lockMode === "optimistic" && this.expressionMap.lockVersion) {
            const metadata = this.expressionMap.mainAlias!.metadata;

            if (this.expressionMap.lockVersion instanceof Date) {
                const actualVersion = metadata.updateDateColumn!.getEntityValue(result); // what if columns arent set?
                if (actualVersion.getTime() !== this.expressionMap.lockVersion.getTime())
                    throw new OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);

            } else {
                const actualVersion = metadata.versionColumn!.getEntityValue(result); // what if columns arent set?
                if (actualVersion !== this.expressionMap.lockVersion)
                    throw new OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);
            }
        }

        return result;
    }

    /**
     * Gets the first entity returned by execution of generated query builder sql or rejects the returned promise on error.
     */
    async getOneOrFail(): Promise<Entity> {
        const entity = await this.getOne();

        if (!entity) {
            throw new EntityNotFoundError(this.expressionMap.mainAlias!.target, this);
        }

        return entity;
    }

    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    async getRawAndEntities<T = any>(): Promise<{ entities: Entity[], raw: T[] }> {
        this.expressionMap.queryEntity = true;
        return this.execute();
    }

    /**
     * Gets entities returned by execution of generated query builder sql.
     */
    async getMany(): Promise<Entity[]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        const results = await this.getRawAndEntities();
        return results.entities;
    }

    /**
     * Gets count - number of entities selected by sql generated by this query builder.
     * Count excludes all limitations set by setFirstResult and setMaxResults methods call.
     */
    async getCount(): Promise<number> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        this.expressionMap.queryEntity = false;
        this.expressionMap.queryCount = true;
        const results = await this.execute();

        return results.count;
    }

    /**
     * Executes built SQL query and returns entities and overall entities count (without limitation).
     * This method is useful to build pagination.
     */
    async getManyAndCount(): Promise<[Entity[], number]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        this.expressionMap.queryEntity = true;
        this.expressionMap.queryCount = true;
        const results = await this.execute();

        return [results.entities, results.count];
    }

    /**
     * Executes built SQL query and returns raw data stream.
     */
    async stream(): Promise<ReadStream> {
        this.expressionMap.rawStream = true;
        return this.execute();
    }

    /**
     * Enables or disables query result caching.
     */
    cache(enabled: boolean): this;

    /**
     * Enables query result caching and sets in milliseconds in which cache will expire.
     * If not set then global caching time will be used.
     */
    cache(milliseconds: number): this;

    /**
     * Enables query result caching and sets cache id and milliseconds in which cache will expire.
     */
    cache(id: any, milliseconds?: number): this;

    /**
     * Enables or disables query result caching.
     */
    cache(enabledOrMillisecondsOrId: boolean|number|string, maybeMilliseconds?: number): this {

        if (typeof enabledOrMillisecondsOrId === "boolean") {
            this.expressionMap.cache = enabledOrMillisecondsOrId;

        } else if (typeof enabledOrMillisecondsOrId === "number") {
            this.expressionMap.cache = true;
            this.expressionMap.cacheDuration = enabledOrMillisecondsOrId;

        } else if (typeof enabledOrMillisecondsOrId === "string" || typeof enabledOrMillisecondsOrId === "number") {
            this.expressionMap.cache = true;
            this.expressionMap.cacheId = enabledOrMillisecondsOrId;
        }

        if (maybeMilliseconds) {
            this.expressionMap.cacheDuration = maybeMilliseconds;
        }

        return this;
    }

    /**
     * Sets extra options that can be used to configure how query builder works.
     */
    setOption(option: SelectQueryBuilderOption): this {
        this.expressionMap.options.push(option);
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected join(direction: "INNER"|"LEFT",
                   entityOrProperty: Function|string|((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>),
                   aliasName: string,
                   condition?: string | ExpressionBuilder,
                   parameters?: ObjectLiteral,
                   mapToProperty?: string,
                   isMappingMany?: boolean): void {

        this.setParameters(parameters || {});

        const joinAttribute = new JoinAttribute(this.connection, this.expressionMap);
        joinAttribute.direction = direction;
        joinAttribute.mapToProperty = mapToProperty;
        joinAttribute.isMappingMany = isMappingMany;
        joinAttribute.entityOrProperty = entityOrProperty; // relationName
        joinAttribute.condition = typeof condition === "string" ? Raw(condition) : condition; // joinInverseSideCondition
        // joinAttribute.junctionAlias = joinAttribute.relation.isOwning ? parentAlias + "_" + destinationTableAlias : destinationTableAlias + "_" + parentAlias;
        this.expressionMap.joinAttributes.push(joinAttribute);

        if (joinAttribute.metadata) {
            // todo: find and set metadata right there?
            joinAttribute.alias = this.expressionMap.createAlias({
                type: "join",
                name: aliasName,
                metadata: joinAttribute.metadata
            });
            if (joinAttribute.relation && joinAttribute.relation.junctionEntityMetadata) {
                this.expressionMap.createAlias({
                    type: "join",
                    name: joinAttribute.junctionAlias,
                    metadata: joinAttribute.relation.junctionEntityMetadata
                });
            }

            if (joinAttribute.metadata.deleteDateColumn && !this.expressionMap.withDeleted) {
                const deleteColumnCondition = IsNull(Col(joinAttribute.alias, joinAttribute.metadata.deleteDateColumn));
                if (joinAttribute.condition !== undefined) joinAttribute.condition = And(joinAttribute.condition, deleteColumnCondition);
                else joinAttribute.condition = deleteColumnCondition;
            }
        } else {
            let subQuery: Expression;
            if (entityOrProperty instanceof Function) {
                subQuery = SubQuery(entityOrProperty as any);
            } else {
                subQuery = Raw(entityOrProperty);
            }
            const isSubQuery = entityOrProperty instanceof Function || entityOrProperty.substr(0, 1) === "(" && entityOrProperty.substr(-1) === ")";
            joinAttribute.alias = this.expressionMap.createAlias({
                type: "join",
                name: aliasName,
                tablePath: isSubQuery === false ? entityOrProperty as string : undefined,
                subQuery: isSubQuery === true ? subQuery : undefined,
            });
        }
    }

    /**
     * Creates "SELECT [DISTINCT] ... FROM ..." part of SQL query.
     */
    protected createSelectExpression() {
        if (!this.expressionMap.mainAlias)
            throw new Error("Cannot build query because main alias is not set (call qb#from method)");

        const select = this.createSelectDistinctExpression();
        const selection = this.computeSelects().map(select =>
            this.buildExpression(null, select.expression!) + (select.alias ? " AS " + this.escape(select.alias) : "")
        ).join(", ");
        const from = this.createSelectFromExpression();

        return select + " " + selection + " " + from;
    }

    /**
     * Creates "SELECT [DISTINCT]" part of SQL query.
     */
    protected createSelectDistinctExpression(): string {
        let select = "SELECT";
        if (this.connection.driver.config.distinctOnClause && this.expressionMap.selectDistinctOn.length > 0) {
            const selectDistinctOnMap = this.expressionMap.selectDistinctOn.map(on => this.buildExpression(null, on)).join(", ");
            select = `SELECT DISTINCT ON (${selectDistinctOnMap})`;
        } else if (this.expressionMap.selectDistinct) {
            select = "SELECT DISTINCT";
        }

        return select;
    }

    /**
     * Creates "FROM ..." part of SQL query.
     */
    protected createSelectFromExpression(): string {
        // create a selection query
        const froms = Object.values(this.expressionMap.aliases)
            .filter(alias => alias.type === "from" && (alias.tablePath || alias.subQuery))
            .map(alias => {
                if (alias.subQuery) {
                    return this.buildExpression(null, alias.subQuery) + " " + this.escape(alias.name);
                }

                return this.getTableName(alias.tablePath!) + " " + this.escape(alias.name);
            });

        const withLockGenerator = this.connection.driver.generators.selectWithLockExpression;
        const lock = withLockGenerator && this.expressionMap.lockMode !== undefined && this.expressionMap.lockMode !== "optimistic"
            ? " " + withLockGenerator(this.expressionMap.lockMode) : "";

        return "FROM " + froms.join(", ") + lock;
    }


    /**
     * Creates "JOIN" part of SQL query.
     */
    protected createJoinExpression(): string {

        // examples:
        // select from owning side
        // qb.select("post")
        //     .leftJoinAndSelect("post.category", "category");
        // select from non-owning side
        // qb.select("category")
        //     .leftJoinAndSelect("category.post", "post");

        return this.expressionMap.joinAttributes.map(joinAttr => {
            const relation = joinAttr.relation;
            const destinationTableName = joinAttr.tablePath;
            const destinationTableAlias = joinAttr.alias.name;
            const parentAlias = joinAttr.parentAlias;

            const query = [];

            // if join was build without relation (e.g. without "post.category") then it means that we have direct
            // table to join, without junction table involved. This means we simply join direct table.
            if (!parentAlias || !relation) {
                const destinationJoin = joinAttr.alias.subQuery ? this.buildExpression(null, joinAttr.alias.subQuery) : this.getTableName(destinationTableName);
                query.push(joinAttr.direction, "JOIN",
                    destinationJoin, this.escape(destinationTableAlias));

                if (joinAttr.condition) query.push("ON", this.buildExpression(null, joinAttr.condition));
            } else {
                // if real entity relation is involved
                let destinationConditions: Expression[];

                if (relation.isManyToOne || relation.isOneToOneOwner) {
                    // JOIN `category` `category` ON `category`.`id` = `post`.`categoryId`
                    destinationConditions = relation.joinColumns.map(joinColumn => {
                        return Equal(Col(destinationTableAlias, joinColumn.referencedColumn!),
                            Col(parentAlias, relation.propertyPath + "." + joinColumn.referencedColumn!.propertyPath));
                    });
                } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                    // JOIN `post` `post` ON `post`.`categoryId` = `category`.`id`
                    destinationConditions = relation.inverseRelation!.joinColumns.map(joinColumn => {
                        return Equal(Col(destinationTableAlias, relation.inverseRelation!.propertyPath + "." + joinColumn.referencedColumn!.propertyPath),
                            Col(parentAlias, joinColumn.referencedColumn!));
                    });

                    if (relation.inverseEntityMetadata.tableType === "entity-child" && relation.inverseEntityMetadata.discriminatorColumn) {
                        destinationConditions.push(
                            Equal(Col(destinationTableAlias, relation.inverseEntityMetadata.discriminatorColumn), relation.inverseEntityMetadata.discriminatorValue));
                    }
                } else { // means many-to-many
                    const junctionTableName = relation.junctionEntityMetadata!.tablePath;
                    const junctionTableAlias = joinAttr.junctionAlias;
                    let junctionConditions: Expression[];

                    if (relation.isOwning) {
                        junctionConditions = relation.joinColumns.map(joinColumn => {
                            // `post_category`.`postId` = `post`.`id`
                            return Equal(Col(junctionTableAlias, joinColumn), Col(parentAlias, joinColumn.referencedColumn!));
                        });

                        destinationConditions = relation.inverseJoinColumns.map(joinColumn => {
                            // `category`.`id` = `post_category`.`categoryId`
                            return Equal(Col(destinationTableAlias, joinColumn.referencedColumn!), Col(junctionTableAlias, joinColumn));
                        });
                    } else {
                        junctionConditions = relation.inverseRelation!.inverseJoinColumns.map(joinColumn => {
                            // `post_category`.`categoryId` = `category`.`id`
                            return Equal(Col(junctionTableAlias, joinColumn), Col(parentAlias, joinColumn.referencedColumn!));
                        });

                        destinationConditions = relation.inverseRelation!.joinColumns.map(joinColumn => {
                            // `post`.`id` = `post_category`.`postId`
                            return Equal(Col(destinationTableAlias, joinColumn.referencedColumn!), Col(junctionTableAlias, joinColumn));
                        });
                    }

                    // Extra join for junction table
                    query.push(joinAttr.direction, "JOIN",
                        this.getTableName(junctionTableName), this.escape(junctionTableAlias),
                        "ON", this.buildExpression(null, And(...junctionConditions)));
                }

                // Extra user provided condition
                if (joinAttr.condition) destinationConditions.push(joinAttr.condition); // TODO: Unnecessary brackets

                query.push(joinAttr.direction, "JOIN",
                    this.getTableName(destinationTableName), this.escape(destinationTableAlias),
                    "ON", this.buildExpression(null, And(...destinationConditions)));
            }

            return query.join(" ");
        }).join(" ");
    }

    /**
     * Creates "GROUP BY" part of SQL query.
     */
    protected createGroupByExpression() {
        if (!this.expressionMap.groupBys || !this.expressionMap.groupBys.length) return null;
        return "GROUP BY " + this.expressionMap.groupBys.map(groupBy => this.buildExpression(null, groupBy)).join(", ");
    }

    /**
     * Creates "LIMIT" and "OFFSET" parts of SQL query.
     */
    protected createLimitOffsetExpression(): string | null {
        // in the case if nothing is joined in the query builder we don't need to make two requests to get paginated results
        // we can use regular limit / offset, that's why we add offset and limit construction here based on skip and take values
        let offset: number|undefined = this.expressionMap.offset,
            limit: number|undefined = this.expressionMap.limit;
        if (!offset && !limit && this.expressionMap.joinAttributes.length === 0) {
            offset = this.expressionMap.skip;
            limit = this.expressionMap.take;
        }

        const limitOffsetGenerator = this.connection.driver.generators.limitOffsetExpression;
        let expression: string | null = null;
        if (limitOffsetGenerator) {
            expression = limitOffsetGenerator(offset, limit);
        } else {
            if (limit && offset) expression = "LIMIT " + limit + " OFFSET " + offset;
            else if (limit) expression = "LIMIT " + limit;
            else if (offset) expression = "OFFSET " + offset;
        }

        if (this.connection.driver instanceof SqlServerDriver) {
            // Due to a limitation in SQL Server's parser implementation it does not support using
            // OFFSET or FETCH NEXT without an ORDER BY clause being provided. In cases where the
            // user does not request one we insert a dummy ORDER BY that does nothing and should
            // have no effect on the query planner or on the order of the results returned.
            // https://dba.stackexchange.com/a/193799
            if (expression && Object.keys(this.expressionMap.allOrderBys).length <= 0) {
                expression = "ORDER BY (SELECT NULL) " + expression;
            }
        }

        return expression;
    }

    /**
     * Creates "LOCK" part of SQL query.
     */

    protected createLockExpression(): string | null {
        if (this.expressionMap.lockMode === undefined || this.expressionMap.lockMode === "optimistic") return null;
        const generator = this.connection.driver.generators.lockExpression;
        const expression = generator ? generator(this.expressionMap.lockMode, this.expressionMap.lockTables) : undefined;
        if (expression === undefined) throw new LockNotSupportedOnGivenDriverError();
        return expression;
    }

    /**
     * Creates "HAVING" part of SQL query.
     */
    protected createHavingExpression() {
        if (!this.expressionMap.having) return null;
        return `HAVING ${this.buildExpression(null, this.expressionMap.having)}`;
    }

    protected computeSelects(): SelectQuery[] {
        // Selection paths that have been included
        const allSelects: Set<string> = new Set();
        // Selection paths implicitly added by "alias" selects
        const implicitSelects: Map<string, SelectQuery> = new Map();

        const computedSelects: Set<SelectQuery> = new Set();
        this.expressionMap.selects.forEach(select => {
            // Ignore empty selections
            if (!select.selection) return;

            // EXPRESSION SELECTS
            // If a raw expression is selected (not mapped!) we don't process it any further
            if (select.selection instanceof ExpressionBuilder) {
                computedSelects.add({ expression: select.selection, alias: select.alias });
                return;
            }

            // IMPLICIT SELECTS ("alias")
            // If a full alias was selected we include all of its columns
            const fullAlias = this.expressionMap.aliases[select.selection];
            if (fullAlias) {
                if (fullAlias.hasMetadata) {
                    fullAlias.metadata.columns
                        .forEach(column => {
                            const selectionPath = fullAlias.name + "." + column.propertyPath;

                            if (!column.isSelect) return;

                            // Don't include columns twice
                            if (allSelects.has(selectionPath)) return;

                            const computedSelect = {
                                selection: selectionPath,
                                expression: Col(fullAlias, column),
                                alias: DriverUtils.buildColumnAlias(this.connection.driver, fullAlias.name, column.databaseName),
                                target: fullAlias,
                                column: column
                            };
                            computedSelects.add(computedSelect);

                            allSelects.add(selectionPath);

                            // Store as implicitly selected so explicit selections can remove it
                            implicitSelects.set(selectionPath, computedSelect);
                        });
                    return;
                } else {
                    computedSelects.add({ expression: Col(fullAlias, "*") });
                    return;
                }
            }

            // EXPLICIT SELECTS ("alias.propertyPath")
            // If a selection path was used we find the column and select it
            const splitPath = QueryBuilderUtils.splitAliasProperty(select.selection);
            if (splitPath) {
                const [aliasName, propertyPath] = splitPath;
                const alias = this.expressionMap.aliases[aliasName];
                if (alias) {
                    if (alias.hasMetadata) {
                        const column = alias.metadata.findColumnWithPropertyPath(propertyPath);
                        if (column) {
                            const selectionPath = alias.name + "." + column.propertyPath;

                            // Remove any matching implicit selects to replace with this explicit select
                            if (implicitSelects.has(selectionPath)) {
                                computedSelects.delete(implicitSelects.get(selectionPath)!);
                                implicitSelects.delete(selectionPath);
                            }

                            computedSelects.add({
                                selection: selectionPath,
                                expression: Col(alias, column),
                                alias: select.alias ? select.alias : DriverUtils.buildColumnAlias(this.connection.driver, alias.name, column.databaseName),
                                target: alias,
                                column: column
                            });

                            // Store as explicitly selected so further implicit selects are ignored
                            allSelects.add(selectionPath);

                            return;
                        }
                    } else {
                        computedSelects.add({ expression: Col(alias, propertyPath), alias: select.alias });
                        return;
                    }
                }
            }

            // RAW SELECTS
            // All other options exhausted, treat as a raw selection
            computedSelects.add({ expression: Raw(select.selection as string), alias: select.alias });
        });

        if (this.expressionMap.queryEntity) {
            // If primary columns were not selected we add them and mark them as "internal" to be removed later
            Object.values(this.expressionMap.aliases)
                .filter(alias => alias.type !== "other" && alias.hasMetadata)
                .forEach(alias => alias.metadata.primaryColumns
                    .filter(column => !allSelects.has(alias.name + "." + column.propertyPath))
                    .forEach(column => computedSelects.add({
                        expression: Col(alias, column),
                        alias: DriverUtils.buildColumnAlias(this.connection.driver, alias.name, column.databaseName),
                        internal: true,
                        target: alias,
                        column: column
                    })));
        }

        // If nothing was selected simply set it to all (*)
        if (computedSelects.size === 0)
            computedSelects.add({ expression: Raw("*") });

        this.expressionMap.selects = [...computedSelects];

        if (this.connection.driver.wrapSelectExpression) {
            this.expressionMap.selects.forEach(select => {
                if (select.column) {
                    select.expression = this.connection.driver.wrapSelectExpression!(select.expression!, select.column);
                }
            });
        }

        return this.expressionMap.selects;
    }

    protected computeCountExpression(): ExpressionBuilder {
        if (
            this.expressionMap.joinAttributes.length === 0 &&
            this.expressionMap.relationIdAttributes.length === 0 &&
            this.expressionMap.relationCountAttributes.length === 0
        ) {
            return Count(Raw("1"));
        } else {
            // If joins are used there may be multiple results produced per actual row so we must filter distinct values
            return CountDistinct(...this.expressionMap.mainAlias!.metadata.primaryColumns.map(c => Col(c)));
        }
    }

    protected async executeCountQuery(queryRunner: QueryRunner): Promise<number> {
        const countSql = this.computeCountExpression();

        const results = await this.clone()
            .orderBy()
            .groupBy()
            .offset(undefined)
            .limit(undefined)
            .skip(undefined)
            .take(undefined)
            .select(countSql, "cnt")
            .setOption("disable-global-order")
            .loadRawResults(queryRunner);

        if (!results || !results[0] || !results[0]["cnt"])
            return 0;

        return parseInt(results[0]["cnt"]);
    }

    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    protected async executeEntitiesAndRawResults(queryRunner: QueryRunner): Promise<{ entities: Entity[], raw: any[] }> {

        if (!this.expressionMap.mainAlias)
            throw new Error(`Alias is not set. Use "from" method to set an alias.`);

        if ((this.expressionMap.lockMode === "pessimistic_read" || this.expressionMap.lockMode === "pessimistic_write" || this.expressionMap.lockMode === "pessimistic_partial_write" || this.expressionMap.lockMode === "pessimistic_write_or_fail" || this.expressionMap.lockMode === "for_no_key_update") && !queryRunner.isTransactionActive)
            throw new PessimisticLockTransactionRequiredError();

        if (this.expressionMap.lockMode === "optimistic") {
            const metadata = this.expressionMap.mainAlias.metadata;
            if (!metadata.versionColumn && !metadata.updateDateColumn)
                throw new NoVersionOrUpdateDateColumnError(metadata.name);
        }

        const relationIdLoader = new RelationIdLoader(this.connection, queryRunner, this.expressionMap.relationIdAttributes);
        const relationCountLoader = new RelationCountLoader(this.connection, queryRunner, this.expressionMap.relationCountAttributes);
        const relationIdMetadataTransformer = new RelationIdMetadataToAttributeTransformer(this.expressionMap);
        relationIdMetadataTransformer.transform();
        const relationCountMetadataTransformer = new RelationCountMetadataToAttributeTransformer(this.expressionMap);
        relationCountMetadataTransformer.transform();

        let rawResults: any[] = [], entities: any[] = [];

        // for pagination enabled (e.g. skip and take) its much more complicated - its a special process
        // where we make two queries to find the data we need
        // first query find ids in skip and take range
        // and second query loads the actual data in given ids range
        if ((this.expressionMap.skip || this.expressionMap.take) && this.expressionMap.joinAttributes.length > 0) {

            // we are skipping order by here because its not working in subqueries anyway
            // to make order by working we need to apply it on a distinct query
            const [selects, orderBys] = this.createOrderByCombinedWithSelectExpression("distinctAlias");
            const metadata = this.expressionMap.mainAlias.metadata;
            const mainAliasName = this.expressionMap.mainAlias.name;

            const querySelects = metadata.primaryColumns.map(primaryColumn => {
                const distinctAlias = this.escape("distinctAlias");
                const columnAlias = this.escape(DriverUtils.buildColumnAlias(this.connection.driver, mainAliasName, primaryColumn.databaseName));
                if (!orderBys[columnAlias]) // make sure we aren't overriding user-defined order in inverse direction
                    orderBys[columnAlias] = "ASC";

                const alias = DriverUtils.buildColumnAlias(
                    this.connection.driver,
                    mainAliasName,
                    primaryColumn.databaseName
                );

                return `${distinctAlias}.${columnAlias} as "${alias}"`;
            });

            rawResults = await new SelectQueryBuilder(this.connection, queryRunner)
                .distinct()
                .select(querySelects)
                //.select(metadata.primaryColumns.map(column => this.escape("distinctAlias") + "." + this.escape(column.databaseName)))
                .addSelect(selects)
                .from(qb => qb.mergeExpressionMap(this.expressionMap).orderBy(), "distinctAlias")
                .offset(this.expressionMap.skip)
                .limit(this.expressionMap.take)
                .orderBy(orderBys)
                .cache(this.expressionMap.cache ? this.expressionMap.cache : this.expressionMap.cacheId, this.expressionMap.cacheDuration)
                .getRawMany();

            const results = rawResults.map(raw => {
                const result = {} as ObjectLiteral;
                metadata.primaryColumns.forEach(column => {
                    const alias = DriverUtils.buildColumnAlias(
                        this.connection.driver,
                        mainAliasName,
                        column.databaseName
                    );

                    column.setEntityValue(result, raw[alias]);
                });
                return result;
            });

            if (results.length > 0) rawResults = await this.andWhereInIds(results).loadRawResults(queryRunner);
        } else {
            rawResults = await this.loadRawResults(queryRunner);
        }

        if (rawResults.length > 0) {
            // transform raw results into entities
            const rawRelationIdResults = await relationIdLoader.load(rawResults);
            const rawRelationCountResults = await relationCountLoader.load(rawResults);
            const transformer = new RawSqlResultsToEntityTransformer(this.expressionMap, this.connection.driver, rawRelationIdResults, rawRelationCountResults, this.queryRunner);
            entities = transformer.transform(rawResults, this.expressionMap.mainAlias!);
        }

        return {
            raw: rawResults,
            entities: entities,
        };
    }

    protected async executeRawStream(queryRunner: QueryRunner): Promise<ReadStream> {
        const [sql, parameters] = this.getQueryAndParameters();
        const releaseFn = () => {
            if (queryRunner !== this.queryRunner) // means we created our own query runner
                return queryRunner.release();
            return;
        };
        return queryRunner.stream(sql, parameters, releaseFn, releaseFn);
    }

    protected createOrderByCombinedWithSelectExpression(parentAlias: string): [string, OrderByCondition] {
        // if table has a default order then apply it
        const orderBys = this.expressionMap.allOrderBys;
        const selectString = Object.keys(orderBys)
            .map(orderCriteria => {
                if (orderCriteria.includes(".")) {
                    const [aliasName, propertyPath] = QueryBuilderUtils.splitAliasProperty(orderCriteria)!;
                    const alias = this.expressionMap.findAliasByName(aliasName);
                    const column = alias.metadata.findColumnWithPropertyPath(propertyPath);
                    return this.escape(parentAlias) + "." + this.escape(DriverUtils.buildColumnAlias(this.connection.driver, aliasName, column!.databaseName));
                } else {
                    if (this.expressionMap.selects.some(select => select.selection === orderCriteria || select.alias === orderCriteria))
                        return this.escape(parentAlias) + "." + orderCriteria;

                    return "";
                }
            })
            .join(", ");

        const orderByObject: OrderByCondition = {};
        Object.keys(orderBys).forEach(orderCriteria => {
            if (orderCriteria.includes(".")) {
                const [aliasName, propertyPath] = QueryBuilderUtils.splitAliasProperty(orderCriteria)!;
                const alias = this.expressionMap.findAliasByName(aliasName);
                const column = alias.metadata.findColumnWithPropertyPath(propertyPath);
                orderByObject[this.escape(parentAlias) + "." + this.escape(DriverUtils.buildColumnAlias(this.connection.driver, aliasName, column!.databaseName))] = orderBys[orderCriteria];
            } else {
                if (this.expressionMap.selects.some(select => select.selection === orderCriteria || select.alias === orderCriteria)) {
                    orderByObject[this.escape(parentAlias) + "." + orderCriteria] = orderBys[orderCriteria];
                } else {
                    orderByObject[orderCriteria] = orderBys[orderCriteria];
                }
            }
        });

        return [selectString, orderByObject];
    }

    /**
     * Loads raw results from the database.
     */
    protected async loadRawResults(queryRunner: QueryRunner) {
        const [sql, parameters] = this.getQueryAndParameters();
        const queryId = sql + " -- PARAMETERS: " + JSON.stringify(parameters);
        const cacheOptions = typeof this.connection.options.cache === "object" ? this.connection.options.cache : {};
        let savedQueryResultCacheOptions: QueryResultCacheOptions|undefined = undefined;
        if (this.connection.queryResultCache && (this.expressionMap.cache || cacheOptions.alwaysEnabled)) {
            savedQueryResultCacheOptions = await this.connection.queryResultCache.getFromCache({
                identifier: this.expressionMap.cacheId,
                query: queryId,
                duration: this.expressionMap.cacheDuration || cacheOptions.duration || 1000
            }, queryRunner);
            if (savedQueryResultCacheOptions && !this.connection.queryResultCache.isExpired(savedQueryResultCacheOptions))
                return JSON.parse(savedQueryResultCacheOptions.result);
        }

        const results = await queryRunner.query(sql, parameters);

        if (this.connection.queryResultCache && (this.expressionMap.cache || cacheOptions.alwaysEnabled)) {
            await this.connection.queryResultCache.storeInCache({
                identifier: this.expressionMap.cacheId,
                query: queryId,
                time: new Date().getTime(),
                duration: this.expressionMap.cacheDuration || cacheOptions.duration || 1000,
                result: JSON.stringify(results)
            }, savedQueryResultCacheOptions, queryRunner);
        }

        return results;
    }

    /**
     * Merges into expression map given expression map properties.
     */
    protected mergeExpressionMap(expressionMap: Partial<QueryExpressionMap>): this {
        Object.assign(this.expressionMap, expressionMap);
        return this;
    }

    /**
     * Normalizes a give number - converts to int if possible.
     */
    protected normalizeNumber(num: any) {
        if (typeof num === "number" || num === undefined || num === null)
            return num;

        return Number(num);
    }

    /**
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    protected obtainQueryRunner() {
        return this.queryRunner || this.connection.createQueryRunner("slave");
    }

    // -------------------------------------------------------------------------
    // Protected Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    protected async executeInsideTransaction(queryRunner: QueryRunner): Promise<{ entities: Entity[], raw: any[], count?: number } | any> {
        let results: { entities: Entity[], raw: any[], count?: number } | any;
        if (this.expressionMap.rawStream) {
            results = await this.executeRawStream(queryRunner);
        } else if (this.expressionMap.queryEntity || this.expressionMap.queryCount) {
            results = this.expressionMap.queryEntity ? await this.executeEntitiesAndRawResults(queryRunner) : {};
            if (this.expressionMap.queryCount) {
                this.expressionMap.queryEntity = false;
                results.count = await this.executeCountQuery(queryRunner);
            }
        } else {
            results = await this.loadRawResults(queryRunner);
        }
        return results;
    }

    protected executeBeforeQueryBroadcast?(queryRunner: QueryRunner, broadcastResult: BroadcasterResult): void;
    protected executeAfterQueryBroadcast(queryRunner: QueryRunner, broadcastResult: BroadcasterResult, result: { entities: Entity[], raw: any[], count?: number } | any): void {
        if (result && result.entities) queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, this.expressionMap.mainAlias!.metadata, result.entities);
    }
}
