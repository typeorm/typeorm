import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {Connection} from "../../connection/Connection";
import {QueryExpressionMap} from "../QueryExpressionMap";
import {SelectQueryBuilder} from "./SelectQueryBuilder";
import {UpdateQueryBuilder} from "./UpdateQueryBuilder";
import {DeleteQueryBuilder} from "./DeleteQueryBuilder";
import {SoftDeleteQueryBuilder} from "./SoftDeleteQueryBuilder";
import {InsertQueryBuilder} from "./InsertQueryBuilder";
import {RelationQueryBuilder} from "./RelationQueryBuilder";
import {EntityTarget} from "../../common/EntityTarget";
import {Alias} from "../Alias";
import {Brackets} from "../Brackets";
import {QueryDeepPartialEntity} from "../QueryPartialEntity";
import {SqljsDriver} from "../../driver/sqljs/SqljsDriver";
import {Driver, EntityMetadata, EntitySchema, IsNull} from "../../index";
import {BroadcasterResult} from "../../subscriber/BroadcasterResult";
import {BuildableExpression, Expression, ExpressionBuilder} from "../../expression-builder/Expression";
import {In} from "../../expression-builder/expression/comparison/In";
import {Raw} from "../../expression-builder/expression/Raw";
import {Or} from "../../expression-builder/expression/logical/Or";
import {Equal} from "../../expression-builder/expression/comparison/Equal";
import {Col} from "../../expression-builder/expression/Column";
import {And} from "../../expression-builder/expression/logical/And";
import {SubQuery} from "../../expression-builder/expression/SubQuery";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";
import {Conditions, EnterContextBuildable} from "../../expression-builder/expression/Conditions";

// todo: completely cover query builder with tests
// todo: entityOrProperty can be target name. implement proper behaviour if it is.
// todo: check in persistment if id exist on object and throw exception (can be in partial selection?)
// todo: fix problem with long aliases eg getMaxIdentifierLength
// todo: fix replacing in .select("COUNT(post.id) AS cnt") statement
// todo: implement joinAlways in relations and relationId
// todo: finish partial selection
// todo: sugar methods like: .addCount and .selectCount, selectCountAndMap, selectSum, selectSumAndMap, ...
// todo: implement @Select decorator
// todo: add select and map functions

// todo: implement relation/entity loading and setting them into properties within a separate query
// .loadAndMap("post.categories", "post.categories", qb => ...)
// .loadAndMap("post.categories", Category, qb => ...)

//export type PathMetadata = EntityMetadata | EmbeddedMetadata | RelationMetadata | ColumnMetadata;
export interface QueryBuilderExpressionContext {
    alias?: Alias;
    metadata?: EntityMetadata;
    columnOrKey?: ColumnMetadata | string;
    //key?: string;
}

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export abstract class QueryBuilder<Entity, Result = any> {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection on which QueryBuilder was created.
     */
    readonly connection: Connection;

    /**
     * Contains all properties of the QueryBuilder that needs to be build a final query.
     */
    readonly expressionMap: QueryExpressionMap;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Query runner used to execute query builder query.
     */
    protected queryRunner?: QueryRunner;

    /**
     * Shortcut for connection driver.
     */
    get driver(): Driver {
        return this.connection.driver;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(queryBuilder: QueryBuilder<any, any>);

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connection: Connection, queryRunner?: QueryRunner);

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connectionOrQueryBuilder: Connection|QueryBuilder<any, any>, queryRunner?: QueryRunner) {
        if (connectionOrQueryBuilder instanceof QueryBuilder) {
            this.connection = connectionOrQueryBuilder.connection;
            this.queryRunner = connectionOrQueryBuilder.queryRunner;
            this.expressionMap = connectionOrQueryBuilder.expressionMap.clone();
        } else {
            this.connection = connectionOrQueryBuilder;
            this.queryRunner = queryRunner;
            this.expressionMap = new QueryExpressionMap(this.connection);
        }
    }

    // -------------------------------------------------------------------------
    // Abstract Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    abstract getQuery(resetParameters?: boolean): string;

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    protected abstract executeInsideTransaction(queryRunner: QueryRunner): Promise<Result>;

    protected abstract executeBeforeQueryBroadcast?(queryRunner: QueryRunner, broadcastResult: BroadcasterResult): void;
    protected abstract executeAfterQueryBroadcast?(queryRunner: QueryRunner, broadcastResult: BroadcasterResult, result: Result): void;

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets the main alias string used in this query builder.
     */
    get alias(): string {
        if (!this.expressionMap.mainAlias)
            throw new Error(`Main alias is not set`); // todo: better exception

        return this.expressionMap.mainAlias.name;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a subquery - query that can be used inside other queries.
     */
    subQuery(): SelectQueryBuilder<any> {
        const SelectQueryBuilderCls = require("./SelectQueryBuilder").SelectQueryBuilder as typeof SelectQueryBuilder;
        const qb = new SelectQueryBuilderCls(this.connection, this.queryRunner);
        qb.expressionMap.subQuery = true;
        return qb;
    }

    /**
     * Creates SELECT query.
     * Replaces all previous selections if they exist.
     */
    select(): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string, selectionAliasName?: string): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string[]): SelectQueryBuilder<Entity>;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection?: string|string[], selectionAliasName?: string): SelectQueryBuilder<Entity> {
        this.expressionMap.queryType = "select";
        if (Array.isArray(selection)) {
            this.expressionMap.selects = selection.map(selection => ({ selection: selection }));
        } else if (selection) {
            this.expressionMap.selects = [{ selection: selection, alias: selectionAliasName }];
        }

        // loading it dynamically because of circular issue
        const SelectQueryBuilderCls = require("./SelectQueryBuilder").SelectQueryBuilder;
        if (this instanceof SelectQueryBuilderCls)
            return this as any;

        return new SelectQueryBuilderCls(this);
    }

    /**
     * Creates INSERT query.
     */
    insert(): InsertQueryBuilder<Entity> {
        this.expressionMap.queryType = "insert";

        // loading it dynamically because of circular issue
        const InsertQueryBuilderCls = require("./InsertQueryBuilder").InsertQueryBuilder;
        if (this instanceof InsertQueryBuilderCls)
            return this as any;

        return new InsertQueryBuilderCls(this);
    }

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(updateSet: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query for the given entity and applies given update values.
     */
    update<Entity>(entity: EntityTarget<Entity>, updateSet?: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query for the given table name and applies given update values.
     */
    update(tableName: string, updateSet?: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(entityOrTableNameUpdateSet?: EntityTarget<any>|ObjectLiteral, maybeUpdateSet?: ObjectLiteral): UpdateQueryBuilder<any> {
        const updateSet = maybeUpdateSet ? maybeUpdateSet : entityOrTableNameUpdateSet as ObjectLiteral|undefined;
        entityOrTableNameUpdateSet = entityOrTableNameUpdateSet instanceof EntitySchema ? entityOrTableNameUpdateSet.options.name : entityOrTableNameUpdateSet;

        if (entityOrTableNameUpdateSet instanceof Function || typeof entityOrTableNameUpdateSet === "string") {
            const mainAlias = this.createFromAlias(entityOrTableNameUpdateSet);
            this.expressionMap.setMainAlias(mainAlias);
        }

        this.expressionMap.queryType = "update";
        this.expressionMap.valuesSet = updateSet;

        // loading it dynamically because of circular issue
        const UpdateQueryBuilderCls = require("./UpdateQueryBuilder").UpdateQueryBuilder;
        if (this instanceof UpdateQueryBuilderCls)
            return this as any;

        return new UpdateQueryBuilderCls(this);
    }

    /**
     * Creates DELETE query.
     */
    delete(): DeleteQueryBuilder<Entity> {
        this.expressionMap.queryType = "delete";

        // loading it dynamically because of circular issue
        const DeleteQueryBuilderCls = require("./DeleteQueryBuilder").DeleteQueryBuilder;
        if (this instanceof DeleteQueryBuilderCls)
            return this as any;

        return new DeleteQueryBuilderCls(this);
    }

    softDelete(): SoftDeleteQueryBuilder<any> {
        this.expressionMap.queryType = "update";

        // loading it dynamically because of circular issue
        const SoftDeleteQueryBuilderCls = require("./SoftDeleteQueryBuilder").SoftDeleteQueryBuilder;
        if (this instanceof SoftDeleteQueryBuilderCls)
            return this as any;

        return new SoftDeleteQueryBuilderCls(this).setSoftDelete("delete");
    }

    restore(): SoftDeleteQueryBuilder<any> {
        this.expressionMap.queryType = "update";

        // loading it dynamically because of circular issue
        const SoftDeleteQueryBuilderCls = require("./SoftDeleteQueryBuilder").SoftDeleteQueryBuilder;
        if (this instanceof SoftDeleteQueryBuilderCls)
            return this as any;

        return new SoftDeleteQueryBuilderCls(this).setSoftDelete("restore");
    }

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(propertyPath: string): RelationQueryBuilder<Entity>;

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation<T>(entityTarget: EntityTarget<T>, propertyPath: string): RelationQueryBuilder<T>;

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(entityTargetOrPropertyPath: Function|string, maybePropertyPath?: string): RelationQueryBuilder<Entity> {
        const entityTarget = arguments.length === 2 ? entityTargetOrPropertyPath : undefined;
        const propertyPath = arguments.length === 2 ? maybePropertyPath as string : entityTargetOrPropertyPath as string;

        this.expressionMap.queryType = "relation";
        this.expressionMap.relationPropertyPath = propertyPath;

        if (entityTarget) {
            const mainAlias = this.createFromAlias(entityTarget);
            this.expressionMap.setMainAlias(mainAlias);
        }

        // loading it dynamically because of circular issue
        const RelationQueryBuilderCls = require("./RelationQueryBuilder").RelationQueryBuilder;
        if (this instanceof RelationQueryBuilderCls)
            return this as any;

        return new RelationQueryBuilderCls(this);
    }


    /**
     * Checks if given relation exists in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: EntityTarget<T>, relation: string): boolean;

    /**
     * Checks if given relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: EntityTarget<T>, relation: string[]): boolean;

    /**
     * Checks if given relation or relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: EntityTarget<T>, relation: string|string[]): boolean {
        const entityMetadata = this.connection.getMetadata(target);
        const relations = Array.isArray(relation) ? relation : [relation];
        return relations.every(relation => {
            return !!entityMetadata.findRelationWithPropertyPath(relation);
        });
    }

    /**
     * Sets parameter name and its value.
     */
    setParameter(key: string, value: any): this {
        this.expressionMap.parameters[key] = value;
        return this;
    }

    /**
     * Adds all parameters from the given object.
     */
    setParameters(parameters: ObjectLiteral): this {

        // remove function parameters
        Object.keys(parameters).forEach(key => {
            if (parameters[key] instanceof Function) {
                throw new Error(`Function parameter isn't supported in the parameters. Please check "${key}" parameter.`);
            }
        });

        Object.keys(parameters).forEach(key => this.setParameter(key, parameters[key]));
        return this;
    }

    /**
     * Gets all parameters.
     */
    getParameters(): ObjectLiteral {
        return Object.assign({}, this.expressionMap.parameters);
    }

    /**
     * Prints sql to stdout using console.log.
     */
    printSql(): this { // TODO rename to logSql()
        const [query, parameters] = this.getQueryAndParameters();
        this.connection.logger.logQuery(query, parameters);
        return this;
    }

    /**
     * Gets generated sql that will be executed.
     * Parameters in the query are escaped for the currently used driver.
     */
    getSql(): string {
        return this.getQueryAndParameters()[0];
    }

    /**
     * Gets query to be executed with all parameters used in it.
     */
    getQueryAndParameters(): [string, any[]] {
        // this execution order is important because getQuery method generates this.expressionMap.nativeParameters values
        const query = this.getQuery();
        return [query, this.expressionMap.nativeParameters];
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<Result> {
        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs: boolean = false;
        try {
            // start transaction if it was enabled
            if (this.expressionMap.useTransaction && !queryRunner.isTransactionActive) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            const shouldDoBroadcast = this.expressionMap.callListeners && this.expressionMap.mainAlias!.hasMetadata;

            if (shouldDoBroadcast && this.executeBeforeQueryBroadcast) {
                const broadcastResult = new BroadcasterResult();
                this.executeBeforeQueryBroadcast(queryRunner, broadcastResult);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            const result = await this.executeInsideTransaction(queryRunner);

            if (shouldDoBroadcast && this.executeAfterQueryBroadcast) {
                const broadcastResult = new BroadcasterResult();
                this.executeAfterQueryBroadcast(queryRunner, broadcastResult, result);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            // close transaction if we started it
            if (transactionStartedByUs) {
                await queryRunner.commitTransaction();
            }

            return result;
        } catch (error) {
            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;
        } finally {
            if (queryRunner !== this.queryRunner && !this.expressionMap.rawStream) { // means we created our own query runner
                await queryRunner.release();
            }
            if (this.connection.driver instanceof SqljsDriver && !queryRunner.isTransactionActive && this.expressionMap.queryType !== "select") {
                await this.connection.driver.autoSave();
            }
        }
    }

    /**
     * Creates a completely new query builder.
     * Uses same query runner as current QueryBuilder.
     */
    createQueryBuilder(): this {
        return new (this.constructor as any)(this.connection, this.queryRunner);
    }

    /**
     * Clones query builder as it is.
     * Note: it uses new query runner, if you want query builder that uses exactly same query runner,
     * you can create query builder using its constructor, for example new SelectQueryBuilder(queryBuilder)
     * where queryBuilder is cloned QueryBuilder.
     */
    clone(): this {
        return new (this.constructor as any)(this);
    }

    /**
     * Includes a Query comment in the query builder.  This is helpful for debugging purposes,
     * such as finding a specific query in the database server's logs, or for categorization using
     * an APM product.
     */
    comment(comment: string): this {
        this.expressionMap.comment = comment;
        return this;
    }

    /**
     * Disables escaping.
     */
    disableEscaping(): this {
        this.expressionMap.disableEscaping = false;
        return this;
    }

    /**
     * Escapes table name, column name or alias name using current database's escaping character.
     */
    escape(name: string): string {
        if (!this.expressionMap.disableEscaping)
            return name;
        return this.connection.driver.escape(name);
    }

    /**
     * Sets or overrides query builder's QueryRunner.
     */
    setQueryRunner(queryRunner: QueryRunner): this {
        this.queryRunner = queryRunner;
        return this;
    }

    /**
     * Indicates if listeners and subscribers must be called before and after query execution.
     * Enabled by default.
     */
    callListeners(enabled: boolean): this {
        this.expressionMap.callListeners = enabled;
        return this;
    }

    /**
     * If set to true the query will be wrapped into a transaction.
     */
    useTransaction(enabled: boolean): this {
        this.expressionMap.useTransaction = enabled;
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected createExpressionContext(metadata?: EntityMetadata, columnOrKey?: ColumnMetadata | string): QueryBuilderExpressionContext {
        return {
            alias: this.expressionMap.mainAlias,
            metadata: metadata ?? (this.expressionMap.mainAlias!.hasMetadata ? this.expressionMap.mainAlias!.metadata : undefined),
            columnOrKey: columnOrKey
        };
    }

    protected buildLiteral(context: QueryBuilderExpressionContext, value: any, raw: boolean = false): string {
        if (!raw || true) return this.buildNativeParameter(value);
        // TODO: CRITICAL
    }

    protected buildColumn(context: QueryBuilderExpressionContext, columnOrName?: string | ColumnMetadata, aliasOrName?: string | Alias): string {
        let alias: Alias | undefined;
        if (aliasOrName instanceof Alias) alias = aliasOrName;
        else if (typeof aliasOrName === "string") alias = this.expressionMap.findAliasByName(aliasOrName);
        else alias = context.alias;

        const aliasPrefix = alias && this.expressionMap.aliasNamePrefixingEnabled ? `${this.escape(alias.name)}.` : "";

        // Should not escape * as it is not a column
        if (columnOrName === "*") return aliasPrefix + "*";

        // Column metadata is provided directly, no need for further searching
        if (columnOrName instanceof ColumnMetadata) return aliasPrefix + this.escape(columnOrName.databaseName);

        // Without alias or metadata we can't check if the column exists, so treat as raw database name
        if (alias === undefined || !alias.hasMetadata) {
            const key = columnOrName ?? context.columnOrKey as string;
            if (key === undefined) throw new Error("Col() used outside of context in which current column could be determined");
            return aliasPrefix + this.escape(key);
        }

        const column = columnOrName ? alias.metadata.columnsMap[columnOrName] : context.columnOrKey as ColumnMetadata;
        if (column !== undefined) return aliasPrefix + this.escape(column.databaseName);

        throw new Error("Col() used outside of context in which current column could be determined");
    }

    protected buildRaw(context: QueryBuilderExpressionContext, expression: string, parameters?: ObjectLiteral) {
        if (parameters) this.setParameters(parameters);
        return this.replaceParameters(this.replacePropertyNames(expression));
    }

    protected buildExpression(context: QueryBuilderExpressionContext | null, expression: Expression, root: boolean = false) {
        if (context === null) context = this.createExpressionContext();

        if (root && context.columnOrKey instanceof ColumnMetadata && !(expression instanceof BuildableExpression)) {
            // Some drivers require additional type information for parameters
            if (this.connection.driver.parametrizeValue)
                expression = this.connection.driver.parametrizeValue(context.columnOrKey, expression);
        }

        // TODO: CRITICAL: implement ExpressionBuildInterface
        return expression instanceof BuildableExpression ? expression.build(this as any, context) : this.buildLiteral(context, expression, false);
    }

    protected buildNativeParameter(value: any): string {
        const index = this.expressionMap.nativeParameters.push(value) - 1;
        return this.connection.driver.createParameter(index);
    }

    protected buildSubQuery(context: any, qb: QueryBuilder<any>): string {
        qb.expressionMap.nativeParameters = this.expressionMap.nativeParameters;
        return qb.getQuery(false);
    }

    protected computeConditionValue(value: Expression): Expression {
        if (value === undefined) return undefined;
        if (value === null) return IsNull();
        if (value instanceof ExpressionBuilder && value.columnComparator) return value;
        return Equal(value);
    }

    protected buildConditions(context: QueryBuilderExpressionContext, conditions: ObjectLiteral): string {
        const columnsOrRelationsOrKeys: (string | ColumnMetadata | RelationMetadata)[] =
            context.metadata?.extractColumnsInEntity(conditions) ?? Object.keys(conditions);

        const mappedConditions = columnsOrRelationsOrKeys.map((columnOrRelationOrKey): [QueryBuilderExpressionContext, Expression][] => {
            if (columnOrRelationOrKey instanceof RelationMetadata) {
                const relation = columnOrRelationOrKey;
                const relatedEntity = columnOrRelationOrKey.getEntityValue(conditions, true);

                if (relation.isWithJoinColumn) {
                    if (relatedEntity instanceof Object) {
                        if (relation.inverseEntityMetadata.hasAllPrimaryKeys(relatedEntity)) {
                            return relation.joinColumns.map(joinColumn => {
                                return [
                                    this.enterColumnOrKeyContext(context, joinColumn),
                                    this.computeConditionValue(joinColumn.getEntityValue(conditions))];
                            });
                        }
                    } else {
                        if (relation.joinColumns.length === 1) {
                            return [[
                                this.enterColumnOrKeyContext(context, relation.joinColumns[0]),
                                this.computeConditionValue(relatedEntity)
                            ]];
                        }
                    }
                }

                // If not, it is a property of the relation so we need to switch to its join alias and metadata
                const join = this.expressionMap.joinAttributes.find(join => join.relation === columnOrRelationOrKey && context.alias!.name === join.parentAlias);
                if (!join) throw new Error(`Relation "${columnOrRelationOrKey.propertyPath}" is not joined, cannot apply conditions`);

                // Switch alias and proceed as if we were at the root of the relation entity metadata
                return [[
                    this.enterAliasContext(context, join.alias),
                    Conditions(relatedEntity),
                ]];
            }

            if (columnOrRelationOrKey instanceof ColumnMetadata)
                return [[
                    this.enterColumnOrKeyContext(context, columnOrRelationOrKey),
                    this.computeConditionValue(columnOrRelationOrKey.getEntityValue(conditions, true))]];

            return [[
                this.enterColumnOrKeyContext(context, columnOrRelationOrKey),
                this.computeConditionValue(conditions[columnOrRelationOrKey])]];
        })
            .flat(1)
            .filter(([, value]) => value !== undefined)
            .map(([context, expression]) => new EnterContextBuildable(context, expression));

        if (mappedConditions.length === 0) return this.buildExpression(context, Equal(1, 1));
        return this.buildExpression(context, And(...mappedConditions));

        /*
        let expression: Expression;
        if (context.metadata === undefined) {
            expression = And(...Object.entries(conditions).map(([key, value]): [string, Expression] => {
                if (value === undefined) return [key, undefined];
                if (value === null) return [key, IsNull()];
                if (value instanceof ExpressionBuilder && value.columnComparator) return [key, value];
                return [key, Equal(value)];
            }).filter(([, value]) => value !== undefined)
                .map(([key, value]) => new EnterContextBuildable(this.enterColumnOrKeyContext(context, key), value)));
        } else {
            expression = And(...context.metadata.extractColumnsInEntity(conditions).map((columnOrRelation): [ColumnMetadata, Expression] => {
                const value = columnOrRelation.getEntityValue(conditions, false);
                if (columnOrRelation instanceof RelationMetadata) {
                    const relation = columnOrRelation;

                    if (relation.joinColumns.length === 1) {
                        const joinColumn = relation.joinColumns[0];
                        return In(Col(joinColumn), )
                    }

                    // Use IN() if only a single primary columns
                    if (!metadata.hasMultiplePrimaryKeys) {
                        const primaryColumn = metadata.primaryColumns[0];
                        return In(Col(primaryColumn), normalized.map(id => primaryColumn.getEntityValue(id, true)));
                    }

                    // Otherwise check if (col1 = val1 AND col2 = val2) ...
                    return Or(
                        ...normalized.map(id =>
                            And(
                                ...relation.joinColumns.map(column =>
                                    Equal(Col(column), column.referencedColumn.getEntityValue(id, true)))
                            )
                        )
                    );
                } else {
                    let expression: Expression;
                    if (value === undefined) expression = undefined;
                    else if (value === null) expression = IsNull();
                    else if (value instanceof ExpressionBuilder && value.columnComparator) expression = value;
                    else expression = Equal(value);

                    return new EnterContextBuildable(columnOrRelation, expression);
                }


            })).filter(([, value]) => value !== undefined).map(([key, value]) => new EnterContextBuildable(key, value)));
        }

        return this.buildExpression(expression, context);*/
    }

    protected createSubQuery(context: any): QueryBuilder<any> {
        return this.subQuery();
    }

    protected enterAliasContext(context: QueryBuilderExpressionContext, alias: Alias): QueryBuilderExpressionContext {
        return {...context, alias: alias, metadata: alias.hasMetadata ? alias.metadata : undefined};
    }

    protected enterColumnOrKeyContext(context: QueryBuilderExpressionContext, columnOrKey: ColumnMetadata | string) {
        return {...context, columnOrKey: columnOrKey};
    }

    /*protected enterPathContext(context: QueryBuilderExpressionContext, path: string): QueryBuilderExpressionContext {
        // We must split the path because of relations
        // e.g. "post.category.embedded.column" does not exist in "post", but it is a valid path nonetheless
        if (path.includes("."))
            return path.split(".").reduce(
                (context, path) => {
                    return this.enterPathContext(context, path);
                }, context);

        // If there is no metadata we treat the path as a raw database column name
        if (context.metadata === undefined) {
            if (context.key !== undefined)
                throw new Error(`Cannot use nested columns without metadata, attempting to access "${path}" within path "${context.key}"`);

            return {...context, key: path};
        }

        let current = context.metadata;
        if (current instanceof ColumnMetadata) {
            if (current.relationMetadata) current = current.relationMetadata.inverseEntityMetadata;
            else
            // Can't go any further if we are already at a column
            throw new Error(`Cannot enter property path "${path}" within column "${current.propertyPath}"`);
        }

        if (current instanceof RelationMetadata) {
            // If the path is to a join column we don't require the relation to be joined
            const joinColumn = current.joinColumns.find(column => column.referencedColumn!.propertyName === path);
            if (joinColumn) return {...context, metadata: joinColumn};

            // If not, it is a property of the relation so we need to switch to its join alias and metadata
            const join = this.expressionMap.joinAttributes.find(join => join.relation === current && context.alias!.name === join.parentAlias);
            if (!join) throw new Error(`Relation "${current.propertyPath}" is not joined, cannot access "${path}"`);

            // Switch alias and proceed as if we were at the root of the relation entity metadata
            context = {...context, alias: join.alias};
            current = join.metadata!; // Relations can only exist between metadata
        }

        // TODO: Consistent naming of ownRelations/relations/etc
        if (current instanceof EntityMetadata) {
            const relation = current.relations.find(relation => relation.propertyPath === path); // TODO: CRITICAL: Property name but no way to filter out embeddeds
            if (relation) return {...context, metadata: relation};

            const embedded = current.embeddeds.find(embedded => embedded.propertyName === path);
            if (embedded) return {...context, metadata: embedded};

            const column = current.ownColumns.find(column => column.propertyName === path);
            if (column) return {...context, metadata: column};

            throw new EntityColumnNotFound(current, path);
        } else { // if (current instanceof EmbeddedMetadata) {
            const relation = current.relations.find(relation => relation.propertyName === path);
            if (relation) return {...context, metadata: relation};

            const embedded = current.embeddeds.find(embedded => embedded.propertyName === path);
            if (embedded) return {...context, metadata: embedded};

            const column = current.columns.find(column => column.propertyName === path);
            if (column) return {...context, metadata: column};

            throw new EntityColumnNotFound(current.entityMetadata, path);
        }
    }*/

    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    protected replacePropertyNames(statement: string) {
        // Escape special characters in regular expressions
        // Per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
        const escapeRegExp = (s: String) => s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

        for (const alias of Object.values(this.expressionMap.aliases)) {
            if (!alias.hasMetadata) continue;
            const replaceAliasNamePrefix = this.expressionMap.aliasNamePrefixingEnabled ? `${alias.name}.` : "";
            const replacementAliasNamePrefix = this.expressionMap.aliasNamePrefixingEnabled ? `${this.escape(alias.name)}.` : "";

            const replacements = alias.metadata.columnsMap;
            const replacementKeys = Object.keys(replacements);
            if (replacementKeys.length) {
                statement = statement.replace(new RegExp(
                    `(?<=[ =\(]|^.{0})` +
                    `${escapeRegExp(replaceAliasNamePrefix)}(${replacementKeys.map(escapeRegExp).join("|")})` +
                    `(?=[ =\)\,]|.{0}$)`,
                    "gm"
                    ), (_, p) =>
                        `${replacementAliasNamePrefix}${this.escape(replacements[p].databaseName)}`
                );
            }
        }

        return statement;
    }

    /**
     * TODO: CRITICAL
     */
    protected replaceParameters(expression: string) {
        // Escape special characters in regular expressions
        // Per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
        const escapeRegExp = (s: String) => s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

        const parameters = this.expressionMap.parameters;
        const parameterKeys = Object.keys(parameters);
        if (parameterKeys.length === 0) return expression;

        return expression.replace(new RegExp(
            `:(\.\.\.)?` +
            `(${parameterKeys.map(escapeRegExp).join("|")})` +
            `\\b`,
            "g"
            ), (_, array, p) =>
                {
                    let value: any = parameters[p];
                    if (array) {
                        return value.map((v: any) => this.buildNativeParameter(v)).join(", ");
                    } else if (value instanceof Function) {
                        return value();
                    } else {
                        return this.buildNativeParameter(value);
                    }
                }
        );
    }

    /**
     * Gets escaped table name with schema name if SqlServer driver used with custom
     * schema name, otherwise returns escaped table name.
     */
    protected getTableName(tablePath: string): string {
        return tablePath.split(".")
            .map(i => {
                // this condition need because in SQL Server driver when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
                if (i === "")
                    return i;
                return this.escape(i);
            }).join(".");
    }

    /**
     * Gets name of the table where insert should be performed.
     */
    protected getMainTableName(): string {
        if (!this.expressionMap.mainAlias)
            throw new Error(`Entity where values should be inserted is not specified. Call "qb.into(entity)" method to specify it.`);

        if (this.expressionMap.mainAlias.hasMetadata)
            return this.expressionMap.mainAlias.metadata.tablePath;

        return this.expressionMap.mainAlias.tablePath!;
    }

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    protected createFromAlias(entityTarget: EntityTarget<any> | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName?: string): Alias {

        // if table has a metadata then find it to properly escape its properties
        // const metadata = this.connection.entityMetadatas.find(metadata => metadata.tableName === tableName);
        if (this.connection.hasMetadata(entityTarget)) {
            const metadata = this.connection.getMetadata(entityTarget);

            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                metadata: this.connection.getMetadata(entityTarget),
                tablePath: metadata.tablePath
            });

        } else if (typeof entityTarget === "string") {
            const isSubquery = entityTarget.substr(0, 1) === "(" && entityTarget.substr(-1) === ")";

            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                tablePath: !isSubquery ? entityTarget as string : undefined,
                subQuery: isSubquery ? Raw(entityTarget) : undefined,
            });
        } else {
            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                subQuery: SubQuery(entityTarget as any)
            });
        }
    }

    protected createComment(): string {
        if (!this.expressionMap.comment) return "";

        // ANSI SQL 2003 support C style comments - comments that start with `/*` and end with `*/`
        // In some dialects query nesting is available - but not all.  Because of this, we'll need
        // to scrub "ending" characters from the SQL but otherwise we can leave everything else
        // as-is and it should be valid.

        return `/* ${this.expressionMap.comment.replace("*/", "")} */`;
    }

    /**
     * Creates "WHERE" expression.
     */
    protected createWhereExpression() {
        const conditions: Expression[] = [];

        if (this.expressionMap.where) conditions.push(this.expressionMap.where);

        if (this.expressionMap.mainAlias!.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            // Adds the global condition of "non-deleted" for the entity with delete date columns in select query.
            if (this.expressionMap.queryType === "select" && !this.expressionMap.withDeleted && metadata.deleteDateColumn) {
                conditions.push(IsNull(Col(metadata.deleteDateColumn)));
            }

            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                conditions.push(
                    In(
                        Col(metadata.discriminatorColumn),
                        metadata.childEntityMetadatas
                            .filter(childMetadata => childMetadata.discriminatorColumn)
                            .map(childMetadata => childMetadata.discriminatorValue!)
                            .concat(metadata.discriminatorValue!)
                    )
                );
            }
        }

        if (conditions.length === 0) return null;

        const where = And(...conditions);
        return `WHERE ${this.buildExpression(null, where)}`;
    }

    /**
     * Creates "ORDER BY" part of SQL query.
     */
    protected createOrderByExpression() {
        const orderBys = this.expressionMap.allOrderBys;
        const orderByEntries = Object.entries(orderBys);
        if (orderByEntries.length === 0) return null;

        const orderByResult = orderByEntries.map(([expression, order]) => {
            return `${this.buildExpression(null, Raw(expression))} ${typeof order === "string" ? order : `${order.order} ${order.nulls}`}`; // TODO: CRITICAL: Raw earlier
        }).join(", ");
        return `ORDER BY ${orderByResult}`;
    }

    /**
     * Creates "WHERE" expression and variables for the given "ids".
     */
    protected computeWhereIdsExpression(ids: any|any[]): ExpressionBuilder {
        const metadata = this.expressionMap.mainAlias!.metadata;
        const normalized = (Array.isArray(ids) ? ids : [ids]).map(id => metadata.ensureEntityIdMap(id));

        // Use IN() if only a single primary columns
        if (!metadata.hasMultiplePrimaryKeys) {
            const primaryColumn = metadata.primaryColumns[0];
            return In(Col(primaryColumn), normalized.map(id => primaryColumn.getEntityValue(id, true)));
        }

        // Otherwise check if (col1 = val1 AND col2 = val2) ...
        return Or(
            ...normalized.map(id =>
                And(
                    ...metadata.primaryColumns.map(column =>
                        Equal(Col(column), column.getEntityValue(id, true)))
                )
            )
        );
    }

    /**
     * Computes given where argument - transforms to a where string all forms it can take.
     */
    protected computeWhereExpression(where: ExpressionBuilder|string|((qb: this) => string)|Brackets|ObjectLiteral|ObjectLiteral[]): Expression | undefined {
        if (typeof where === "string") return Raw(where);
        else if (typeof where === "function") return Raw(where(this));
        else if (where instanceof Brackets) {
            const whereQueryBuilder = this.createQueryBuilder();
            whereQueryBuilder.expressionMap.mainAlias = this.expressionMap.mainAlias;
            where.whereFactory(whereQueryBuilder as any);
            this.setParameters(whereQueryBuilder.getParameters());
            return whereQueryBuilder.expressionMap.where;
        } else if (where instanceof Object) {
            return Or(...(Array.isArray(where) ? where : [where]));
        }

        return undefined;
    }

    /**
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    protected obtainQueryRunner() {
        return this.queryRunner || this.connection.createQueryRunner();
    }
}
