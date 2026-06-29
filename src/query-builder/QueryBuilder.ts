import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { QueryRunner } from "../query-runner/QueryRunner"
import type { DataSource } from "../data-source/DataSource"
import type { QueryBuilderCteOptions } from "./QueryBuilderCte"
import { QueryExpressionMap } from "./QueryExpressionMap"
import type { SelectQueryBuilder } from "./SelectQueryBuilder"
import type { UpdateQueryBuilder } from "./UpdateQueryBuilder"
import type { DeleteQueryBuilder } from "./DeleteQueryBuilder"
import type { SoftDeleteQueryBuilder } from "./SoftDeleteQueryBuilder"
import type { InsertQueryBuilder } from "./InsertQueryBuilder"
import type { RelationQueryBuilder } from "./RelationQueryBuilder"
import type { EntityTarget } from "../common/EntityTarget"
import type { Alias } from "./Alias"
import { Brackets } from "./Brackets"
import type { QueryDeepPartialEntity } from "./QueryPartialEntity"
import type { EntityMetadata } from "../metadata/EntityMetadata"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import { FindOperator } from "../find-options/FindOperator"
import { Equal } from "../find-options/operator/Equal"
import { In } from "../find-options/operator/In"
import { TypeORMError } from "../error"
import type { OrderByCondition } from "../find-options/OrderByCondition"
import type { WhereClause, WhereClauseCondition } from "./WhereClause"
import type { NotBrackets } from "./NotBrackets"
import { EntityPropertyNotFoundError } from "../error/EntityPropertyNotFoundError"
import type { ReturningType } from "../driver/types/ReturningType"
import type { OracleDriver } from "../driver/oracle/OracleDriver"
import { InstanceChecker } from "../util/InstanceChecker"
import { escapeRegExp } from "../util/escapeRegExp"

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

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export abstract class QueryBuilder<Entity extends ObjectLiteral> {
    readonly "@instanceof" = Symbol.for("QueryBuilder")

    // ----------------------------------------------------------------------------
    // Public Properties
    // ----------------------------------------------------------------------------

    /**
     * DataSource on which QueryBuilder was created.
     */
    readonly dataSource: DataSource

    /**
     * DataSource on which QueryBuilder was created.
     *
     * @deprecated since 1.0.0. Use {@link dataSource} instance instead.
     */
    get connection(): DataSource {
        return this.dataSource
    }

    /**
     * Contains all properties of the QueryBuilder that needs to be build a final query.
     */
    readonly expressionMap: QueryExpressionMap

    // ----------------------------------------------------------------------------
    // Protected Properties
    // ----------------------------------------------------------------------------

    /**
     * Query runner used to execute query builder query.
     */
    protected queryRunner?: QueryRunner

    /**
     * If QueryBuilder was created in a subquery mode then its parent QueryBuilder (who created subquery) will be stored here.
     */
    protected parentQueryBuilder: QueryBuilder<any>

    /**
     * Memo to help keep place of current parameter index for `createParameter`
     */
    private parameterIndex = 0

    /**
     * Contains all registered query builder classes.
     */
    private static queryBuilderRegistry: Record<string, any> = {}

    // ----------------------------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------------------------

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(queryBuilder: QueryBuilder<any>)

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connection: DataSource, queryRunner?: QueryRunner)

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     *
     * @param connectionOrQueryBuilder
     * @param queryRunner
     */
    constructor(
        connectionOrQueryBuilder: DataSource | QueryBuilder<any>,
        queryRunner?: QueryRunner,
    ) {
        if (InstanceChecker.isDataSource(connectionOrQueryBuilder)) {
            this.dataSource = connectionOrQueryBuilder
            this.queryRunner = queryRunner
            this.expressionMap = new QueryExpressionMap(this.dataSource)
        } else {
            this.dataSource = connectionOrQueryBuilder.dataSource
            this.queryRunner = connectionOrQueryBuilder.queryRunner
            this.expressionMap = connectionOrQueryBuilder.expressionMap.clone()
        }
    }

    static registerQueryBuilderClass(name: string, factory: any) {
        QueryBuilder.queryBuilderRegistry[name] = factory
    }

    // ----------------------------------------------------------------------------
    // Abstract Methods
    // ----------------------------------------------------------------------------

    /**
     * Gets generated SQL query without parameters being replaced.
     */
    abstract getQuery(): string

    // ----------------------------------------------------------------------------
    // Accessors
    // ----------------------------------------------------------------------------

    /**
     * Gets the main alias string used in this query builder.
     */
    get alias(): string {
        if (!this.expressionMap.mainAlias)
            throw new TypeORMError(`Main alias is not set`) // todo: better exception

        return this.expressionMap.mainAlias.name
    }

    // ----------------------------------------------------------------------------
    // Public Methods
    // ----------------------------------------------------------------------------

    /**
     * Creates SELECT query.
     * Replaces all previous selections if they exist.
     */
    select(): SelectQueryBuilder<Entity>

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(
        selection: string,
        selectionAliasName?: string,
    ): SelectQueryBuilder<Entity>

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string[]): SelectQueryBuilder<Entity>

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     *
     * @param selection
     * @param selectionAliasName
     */
    select(
        selection?: string | string[],
        selectionAliasName?: string,
    ): SelectQueryBuilder<Entity> {
        this.expressionMap.queryType = "select"
        if (Array.isArray(selection)) {
            this.expressionMap.selects = selection.map((selection) => ({
                selection: selection,
            }))
        } else if (selection) {
            this.expressionMap.selects = [
                { selection: selection, aliasName: selectionAliasName },
            ]
        }

        if (InstanceChecker.isSelectQueryBuilder(this)) return this as any

        return QueryBuilder.queryBuilderRegistry["SelectQueryBuilder"](this)
    }

    /**
     * Creates INSERT query.
     */
    insert(): InsertQueryBuilder<Entity> {
        this.expressionMap.queryType = "insert"

        if (InstanceChecker.isInsertQueryBuilder(this)) return this as any

        return QueryBuilder.queryBuilderRegistry["InsertQueryBuilder"](this)
    }

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(): UpdateQueryBuilder<Entity>

    /**
     * Creates UPDATE query for the given entity.
     */
    update<Entity extends ObjectLiteral>(
        entity: EntityTarget<Entity>,
    ): UpdateQueryBuilder<Entity>

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(
        updateSet: QueryDeepPartialEntity<Entity>,
    ): UpdateQueryBuilder<Entity>

    /**
     * Creates UPDATE query for the given entity and applies given update values.
     */
    update<Entity extends ObjectLiteral>(
        entity: EntityTarget<Entity>,
        updateSet?: QueryDeepPartialEntity<Entity>,
    ): UpdateQueryBuilder<Entity>

    /**
     * Creates UPDATE query for the given table name and applies given update values.
     */
    update(
        tableName: string,
        updateSet?: QueryDeepPartialEntity<Entity>,
    ): UpdateQueryBuilder<Entity>

    /**
     * Creates UPDATE query and applies given update values.
     *
     * @param entityOrTableNameUpdateSet
     * @param maybeUpdateSet
     */
    update(
        entityOrTableNameUpdateSet?: EntityTarget<any> | ObjectLiteral,
        maybeUpdateSet?: ObjectLiteral,
    ): UpdateQueryBuilder<any> {
        const updateSet =
            maybeUpdateSet ??
            (entityOrTableNameUpdateSet as ObjectLiteral | undefined)
        entityOrTableNameUpdateSet = InstanceChecker.isEntitySchema(
            entityOrTableNameUpdateSet,
        )
            ? entityOrTableNameUpdateSet.options.name
            : entityOrTableNameUpdateSet

        if (
            typeof entityOrTableNameUpdateSet === "function" ||
            typeof entityOrTableNameUpdateSet === "string"
        ) {
            const mainAlias = this.createFromAlias(entityOrTableNameUpdateSet)
            this.expressionMap.setMainAlias(mainAlias)
        }

        this.expressionMap.queryType = "update"
        this.expressionMap.valuesSet = updateSet

        if (InstanceChecker.isUpdateQueryBuilder(this)) return this as any

        return QueryBuilder.queryBuilderRegistry["UpdateQueryBuilder"](this)
    }

    /**
     * Creates DELETE query.
     */
    delete(): DeleteQueryBuilder<Entity> {
        this.expressionMap.queryType = "delete"

        if (InstanceChecker.isDeleteQueryBuilder(this)) return this as any

        return QueryBuilder.queryBuilderRegistry["DeleteQueryBuilder"](this)
    }

    softDelete(): SoftDeleteQueryBuilder<any> {
        this.expressionMap.queryType = "soft-delete"

        if (InstanceChecker.isSoftDeleteQueryBuilder(this)) return this as any

        return QueryBuilder.queryBuilderRegistry["SoftDeleteQueryBuilder"](this)
    }

    restore(): SoftDeleteQueryBuilder<any> {
        this.expressionMap.queryType = "restore"

        if (InstanceChecker.isSoftDeleteQueryBuilder(this)) return this as any

        return QueryBuilder.queryBuilderRegistry["SoftDeleteQueryBuilder"](this)
    }

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(propertyPath: string): RelationQueryBuilder<Entity>

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation<T extends ObjectLiteral>(
        entityTarget: EntityTarget<T>,
        propertyPath: string,
    ): RelationQueryBuilder<T>

    /**
     * Sets entity's relation with which this query builder gonna work.
     *
     * @param entityTargetOrPropertyPath
     * @param maybePropertyPath
     */
    relation(
        entityTargetOrPropertyPath: Function | string,
        maybePropertyPath?: string,
    ): RelationQueryBuilder<Entity> {
        const entityTarget =
            arguments.length === 2 ? entityTargetOrPropertyPath : undefined
        const propertyPath =
            arguments.length === 2
                ? (maybePropertyPath as string)
                : (entityTargetOrPropertyPath as string)

        this.expressionMap.queryType = "relation"
        this.expressionMap.relationPropertyPath = propertyPath

        if (entityTarget) {
            const mainAlias = this.createFromAlias(entityTarget)
            this.expressionMap.setMainAlias(mainAlias)
        }

        if (InstanceChecker.isRelationQueryBuilder(this)) return this as any

        return QueryBuilder.queryBuilderRegistry["RelationQueryBuilder"](this)
    }

    /**
     * Checks if given relation exists in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: EntityTarget<T>, relation: string): boolean

    /**
     * Checks if given relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: EntityTarget<T>, relation: string[]): boolean

    /**
     * Checks if given relation or relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     *
     * @param target
     * @param relation
     */
    hasRelation<T>(
        target: EntityTarget<T>,
        relation: string | string[],
    ): boolean {
        const entityMetadata = this.dataSource.getMetadata(target)
        const relations = Array.isArray(relation) ? relation : [relation]
        return relations.every((relation) => {
            return !!entityMetadata.findRelationWithPropertyPath(relation)
        })
    }

    /**
     * Check the existence of a parameter for this query builder.
     *
     * @param key
     */
    hasParameter(key: string): boolean {
        return (
            this.parentQueryBuilder?.hasParameter(key) ||
            key in this.expressionMap.parameters
        )
    }

    /**
     * Sets parameter name and its value.
     *
     * The key for this parameter may contain numbers, letters, underscores, or periods.
     *
     * @param key
     * @param value
     */
    setParameter(key: string, value: any): this {
        if (typeof value === "function") {
            throw new TypeORMError(
                `Function parameter isn't supported in the parameters. Please check "${key}" parameter.`,
            )
        }

        if (!key.match(/^([A-Za-z0-9_.]+)$/)) {
            throw new TypeORMError(
                "QueryBuilder parameter keys may only contain numbers, letters, underscores, or periods.",
            )
        }

        if (this.parentQueryBuilder) {
            this.parentQueryBuilder.setParameter(key, value)
        }

        this.expressionMap.parameters[key] = value
        return this
    }

    /**
     * Adds all parameters from the given object.
     *
     * @param parameters
     */
    setParameters(parameters: ObjectLiteral): this {
        for (const [key, value] of Object.entries(parameters)) {
            this.setParameter(key, value)
        }

        return this
    }

    protected createParameter(value: any): string {
        let parameterName

        do {
            parameterName = `orm_param_${this.parameterIndex++}`
        } while (this.hasParameter(parameterName))

        this.setParameter(parameterName, value)

        return `:${parameterName}`
    }

    /**
     * Gets all parameters.
     */
    getParameters(): ObjectLiteral {
        const parameters: ObjectLiteral = Object.assign(
            {},
            this.expressionMap.parameters,
        )

        // add discriminator column parameter if it exist
        if (this.expressionMap.mainAlias?.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata
            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                const values = metadata.childEntityMetadatas
                    .filter(
                        (childMetadata) => childMetadata.discriminatorColumn,
                    )
                    .map((childMetadata) => childMetadata.discriminatorValue)
                values.push(metadata.discriminatorValue)
                parameters["discriminatorColumnValues"] = values
            }
        }

        return parameters
    }

    /**
     * Gets generated sql that will be executed.
     * Parameters in the query are escaped for the currently used driver.
     */
    getSql(): string {
        return this.getQueryAndParameters()[0]
    }

    /**
     * Gets query to be executed with all parameters used in it.
     */
    getQueryAndParameters(): [string, any[]] {
        const query = this.getQuery()
        const parameters = this.getParameters()
        return this.dataSource.driver.escapeQueryWithParameters(
            query,
            parameters,
        )
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<any> {
        const [sql, parameters] = this.getQueryAndParameters()
        const queryRunner = this.obtainQueryRunner()
        try {
            return await queryRunner.query(sql, parameters) // await is needed here because we are using finally
        } finally {
            if (queryRunner !== this.queryRunner) {
                // means we created our own query runner
                await queryRunner.release()
            }
        }
    }

    /**
     * Creates a completely new query builder.
     * Uses same query runner as current QueryBuilder.
     *
     * @param queryRunner
     */
    createQueryBuilder(queryRunner?: QueryRunner): this {
        return new (this.constructor as any)(
            this.dataSource,
            queryRunner ?? this.queryRunner,
        )
    }

    /**
     * Clones query builder as it is.
     * Note: it uses new query runner, if you want query builder that uses exactly same query runner,
     * you can create query builder using its constructor, for example new SelectQueryBuilder(queryBuilder)
     * where queryBuilder is cloned QueryBuilder.
     */
    clone(): this {
        return new (this.constructor as any)(this)
    }

    /**
     * Includes a Query comment in the query builder.  This is helpful for debugging purposes,
     * such as finding a specific query in the database server's logs, or for categorization using
     * an APM product.
     *
     * @param comment
     */
    comment(comment: string): this {
        this.expressionMap.comment = comment
        return this
    }

    /**
     * Disables escaping.
     */
    disableEscaping(): this {
        this.expressionMap.disableEscaping = false
        return this
    }

    /**
     * Escapes table name, column name or alias name using current database's escaping character.
     *
     * @param name
     */
    escape(name: string): string {
        if (!this.expressionMap.disableEscaping) return name
        return this.dataSource.driver.escape(name)
    }

    /**
     * Sets or overrides query builder's QueryRunner.
     *
     * @param queryRunner
     */
    setQueryRunner(queryRunner: QueryRunner): this {
        this.queryRunner = queryRunner
        return this
    }

    /**
     * Indicates if listeners and subscribers must be called before and after query execution.
     * Enabled by default.
     *
     * @param enabled
     */
    callListeners(enabled: boolean): this {
        this.expressionMap.callListeners = enabled
        return this
    }

    /**
     * If set to true the query will be wrapped into a transaction.
     *
     * @param enabled
     */
    useTransaction(enabled: boolean): this {
        this.expressionMap.useTransaction = enabled
        return this
    }

    /**
     * Adds CTE to query
     *
     * @param queryBuilder
     * @param alias
     * @param options
     */
    addCommonTableExpression(
        queryBuilder: QueryBuilder<any> | string,
        alias: string,
        options?: QueryBuilderCteOptions,
    ): this {
        this.expressionMap.commonTableExpressions.push({
            queryBuilder,
            alias,
            options: options ?? {},
        })
        return this
    }

    // ----------------------------------------------------------------------------
    // Protected Methods
    // ----------------------------------------------------------------------------

    /**
     * Gets escaped table name with schema name if SqlServer driver used with custom
     * schema name, otherwise returns escaped table name.
     *
     * @param tablePath
     */
    protected getTableName(tablePath: string): string {
        return tablePath
            .split(".")
            .map((i) => {
                // this condition need because in SQL Server driver when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
                if (i === "") return i
                return this.escape(i)
            })
            .join(".")
    }

    /**
     * Gets name of the table where insert should be performed.
     */
    protected getMainTableName(): string {
        if (!this.expressionMap.mainAlias)
            throw new TypeORMError(
                `Entity where values should be inserted is not specified. Call "qb.into(entity)" method to specify it.`,
            )

        if (this.expressionMap.mainAlias.hasMetadata)
            return this.expressionMap.mainAlias.metadata.tablePath

        return this.expressionMap.mainAlias.tablePath!
    }

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     *
     * @param entityTarget
     * @param aliasName
     */
    protected createFromAlias(
        entityTarget:
            | EntityTarget<any>
            | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>),
        aliasName?: string,
    ): Alias {
        // if table has a metadata then find it to properly escape its properties
        // const metadata = this.dataSource.entityMetadatas.find(metadata => metadata.tableName === tableName);
        if (this.dataSource.hasMetadata(entityTarget)) {
            const metadata = this.dataSource.getMetadata(entityTarget)

            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                metadata: this.dataSource.getMetadata(entityTarget),
                tablePath: metadata.tablePath,
            })
        } else {
            if (typeof entityTarget === "string") {
                const isSubquery =
                    entityTarget.startsWith("(") && entityTarget.endsWith(")")

                return this.expressionMap.createAlias({
                    type: "from",
                    name: aliasName,
                    tablePath: !isSubquery
                        ? (entityTarget as string)
                        : undefined,
                    subQuery: isSubquery ? entityTarget : undefined,
                })
            }

            const subQueryBuilder: SelectQueryBuilder<any> = (
                entityTarget as any
            )((this as any as SelectQueryBuilder<any>).subQuery())
            this.setParameters(subQueryBuilder.getParameters())
            const subquery = subQueryBuilder.getQuery()

            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                subQuery: subquery,
            })
        }
    }
}
