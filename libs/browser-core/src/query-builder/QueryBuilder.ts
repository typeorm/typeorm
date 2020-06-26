import { ObjectLiteral } from "../common/ObjectLiteral";
import { QueryRunner } from "../query-runner/QueryRunner";
import { Connection } from "../connection/Connection";
import { QueryExpressionMap } from "./QueryExpressionMap";
import { ObjectType } from "../common/ObjectType";
import { Alias } from "./Alias";
import { Brackets } from "./Brackets";
import { QueryDeepPartialEntity } from "./QueryPartialEntity";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { ColumnMetadata } from "../metadata/ColumnMetadata";
import { EntitySchema } from "../entity-schema/EntitySchema";
import { FindOperator } from "../find-options/FindOperator";
import { In } from "../find-options/operator/In";
import { EntityColumnNotFound } from "../error/EntityColumnNotFound";
import { WhereExpression } from './WhereExpression';
import { UpdateResult } from './result/UpdateResult';
import { BroadcasterResult } from '../subscriber/BroadcasterResult';
import { ReturningResultsEntityUpdator } from './ReturningResultsEntityUpdator';
import { ReturningStatementNotSupportedError } from '../error/ReturningStatementNotSupportedError';
import { UpdateValuesMissingError } from '../error/UpdateValuesMissingError';
import { LimitOnUpdateNotSupportedError } from '../error/LimitOnUpdateNotSupportedError';
import { RelationUpdater } from './RelationUpdater';
import { RelationRemover } from './RelationRemover';
import { RelationIdAttribute } from './relation-id/RelationIdAttribute';
import { RelationCountAttribute } from './relation-count/RelationCountAttribute';
import { OptimisticLockCanNotBeUsedError } from '../error/OptimisticLockCanNotBeUsedError';
import { OptimisticLockVersionMismatchError } from '../error/OptimisticLockVersionMismatchError';
import { ReadStream } from 'fs';
import { SelectQueryBuilderOption } from './SelectQueryBuilderOption';
import { JoinAttribute } from './JoinAttribute';
import { SelectQuery } from './SelectQuery';
import { OffsetWithoutLimitNotSupportedError } from '../error/OffsetWithoutLimitNotSupportedError';
import { LockNotSupportedOnGivenDriverError } from '../error/LockNotSupportedOnGivenDriverError';
import { PessimisticLockTransactionRequiredError } from '../error/PessimisticLockTransactionRequiredError';
import { NoVersionOrUpdateDateColumnError } from '../error/NoVersionOrUpdateDateColumnError';
import { RelationIdLoader } from './relation-id/RelationIdLoader';
import { RelationCountLoader } from './relation-count/RelationCountLoader';
import { RelationIdMetadataToAttributeTransformer } from './relation-id/RelationIdMetadataToAttributeTransformer';
import { RelationCountMetadataToAttributeTransformer } from './relation-count/RelationCountMetadataToAttributeTransformer';
import { RawSqlResultsToEntityTransformer } from './transformer/RawSqlResultsToEntityTransformer';
import { QueryResultCacheOptions } from '../cache/QueryResultCacheOptions';
import { ObjectUtils } from '../util/ObjectUtils';
import { RandomGenerator } from '../util/RandomGenerator';
import { InsertValuesMissingError } from '../error/InsertValuesMissingError';
import { MissingDeleteDateColumnError } from '../error/MissingDeleteDateColumnError';
import { OrderByCondition } from '../find-options/OrderByCondition';
import { DeleteResult } from './result/DeleteResult';
import { DriverUtils } from '../driver/DriverUtils';
import { InsertResult } from './result/InsertResult';

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
export abstract class QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    abstract SelectQueryBuilderCls: new (
        connectionOrQueryBuilder: Connection | QueryBuilder<any>,
        queryRunner?: QueryRunner
    ) => SelectQueryBuilder<Entity>;

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

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(queryBuilder: QueryBuilder<any>);

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connection: Connection, queryRunner?: QueryRunner);

    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connectionOrQueryBuilder: Connection | QueryBuilder<any>, queryRunner?: QueryRunner) {
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
     * Gets the main alias string used in this query builder.
     */
    get alias(): string {
        if (!this.expressionMap.mainAlias)
            throw new Error(`Main alias is not set`); // todo: better exception

        return this.expressionMap.mainAlias.name;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    abstract getQuery(): string;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

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
    select(selection?: string | string[], selectionAliasName?: string): SelectQueryBuilder<Entity> {
        this.expressionMap.queryType = "select";
        if (Array.isArray(selection)) {
            this.expressionMap.selects = selection.map(selection => ({selection: selection}));
        } else if (selection) {
            this.expressionMap.selects = [{selection: selection, aliasName: selectionAliasName}];
        }

        if (this instanceof this.SelectQueryBuilderCls)
            return this as any;

        return new this.SelectQueryBuilderCls(this);
    }

    /**
     * Creates INSERT query.
     */
    insert(): InsertQueryBuilder<Entity> {
        this.expressionMap.queryType = "insert";

        // loading it dynamically because of circular issue
        const InsertQueryBuilderCls = InsertQueryBuilder;
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
    update<T>(entity: ObjectType<T>, updateSet?: QueryDeepPartialEntity<T>): UpdateQueryBuilder<T>;

    /**
     * Creates UPDATE query for the given entity and applies given update values.
     */
    update<T>(entity: EntitySchema<T>, updateSet?: QueryDeepPartialEntity<T>): UpdateQueryBuilder<T>;

    /**
     * Creates UPDATE query for the given entity and applies given update values.
     */
    update(entity: Function | EntitySchema<Entity> | string, updateSet?: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query for the given table name and applies given update values.
     */
    update(tableName: string, updateSet?: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;

    /**
     * Creates UPDATE query and applies given update values.
     */
    update(entityOrTableNameUpdateSet?: string | Function | EntitySchema<any> | ObjectLiteral, maybeUpdateSet?: ObjectLiteral): UpdateQueryBuilder<any> {
        const updateSet = maybeUpdateSet ? maybeUpdateSet : entityOrTableNameUpdateSet as ObjectLiteral | undefined;
        entityOrTableNameUpdateSet = entityOrTableNameUpdateSet instanceof EntitySchema ? entityOrTableNameUpdateSet.options.name : entityOrTableNameUpdateSet;

        if (entityOrTableNameUpdateSet instanceof Function || typeof entityOrTableNameUpdateSet === "string") {
            const mainAlias = this.createFromAlias(entityOrTableNameUpdateSet);
            this.expressionMap.setMainAlias(mainAlias);
        }

        this.expressionMap.queryType = "update";
        this.expressionMap.valuesSet = updateSet;

        // loading it dynamically because of circular issue
        const UpdateQueryBuilderCls = UpdateQueryBuilder;
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
        const DeleteQueryBuilderCls = DeleteQueryBuilder;
        if (this instanceof DeleteQueryBuilderCls)
            return this as any;

        return new DeleteQueryBuilderCls(this);
    }

    softDelete(): SoftDeleteQueryBuilder<any> {
        this.expressionMap.queryType = "soft-delete";

        // loading it dynamically because of circular issue
        const SoftDeleteQueryBuilderCls = SoftDeleteQueryBuilder;
        if (this instanceof SoftDeleteQueryBuilderCls)
            return this as any;

        return new SoftDeleteQueryBuilderCls(this);
    }

    restore(): SoftDeleteQueryBuilder<any> {
        this.expressionMap.queryType = "restore";

        // loading it dynamically because of circular issue
        const SoftDeleteQueryBuilderCls = SoftDeleteQueryBuilder;
        if (this instanceof SoftDeleteQueryBuilderCls)
            return this as any;

        return new SoftDeleteQueryBuilderCls(this);
    }

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(propertyPath: string): RelationQueryBuilder<Entity>;

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation<T>(entityTarget: ObjectType<T> | string, propertyPath: string): RelationQueryBuilder<T>;

    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(entityTargetOrPropertyPath: Function | string, maybePropertyPath?: string): RelationQueryBuilder<Entity> {
        const entityTarget = arguments.length === 2 ? entityTargetOrPropertyPath : undefined;
        const propertyPath = arguments.length === 2 ? maybePropertyPath as string : entityTargetOrPropertyPath as string;

        this.expressionMap.queryType = "relation";
        this.expressionMap.relationPropertyPath = propertyPath;

        if (entityTarget) {
            const mainAlias = this.createFromAlias(entityTarget);
            this.expressionMap.setMainAlias(mainAlias);
        }

        // loading it dynamically because of circular issue
        const RelationQueryBuilderCls = RelationQueryBuilder;
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
    hasRelation<T>(target: ObjectType<T> | string, relation: string): boolean;

    /**
     * Checks if given relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: ObjectType<T> | string, relation: string[]): boolean;

    /**
     * Checks if given relation or relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    hasRelation<T>(target: ObjectType<T> | string, relation: string | string[]): boolean {
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

        // set parent query builder parameters as well in sub-query mode
        if (this.expressionMap.parentQueryBuilder)
            this.expressionMap.parentQueryBuilder.setParameters(parameters);

        Object.keys(parameters).forEach(key => this.setParameter(key, parameters[key]));
        return this;
    }

    /**
     * Adds native parameters from the given object.
     */
    setNativeParameters(parameters: ObjectLiteral): this {

        // set parent query builder parameters as well in sub-query mode
        if (this.expressionMap.parentQueryBuilder)
            this.expressionMap.parentQueryBuilder.setNativeParameters(parameters);

        Object.keys(parameters).forEach(key => {
            this.expressionMap.nativeParameters[key] = parameters[key];
        });
        return this;
    }

    /**
     * Gets all parameters.
     */
    getParameters(): ObjectLiteral {
        const parameters: ObjectLiteral = Object.assign({}, this.expressionMap.parameters);

        // add discriminator column parameter if it exist
        if (this.expressionMap.mainAlias && this.expressionMap.mainAlias.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                const values = metadata.childEntityMetadatas
                    .filter(childMetadata => childMetadata.discriminatorColumn)
                    .map(childMetadata => childMetadata.discriminatorValue);
                values.push(metadata.discriminatorValue);
                parameters["discriminatorColumnValues"] = values;
            }
        }

        return parameters;
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
        const parameters = this.getParameters();
        return this.connection.driver.escapeQueryWithParameters(query, parameters, this.expressionMap.nativeParameters);
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<any> {
        const [sql, parameters] = this.getQueryAndParameters();
        const queryRunner = this.obtainQueryRunner();
        try {
            return await queryRunner.query(sql, parameters);  // await is needed here because we are using finally

        } finally {
            if (queryRunner !== this.queryRunner) { // means we created our own query runner
                await queryRunner.release();
            }
            if (this.connection.driver.autoSave) {
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
    protected createFromAlias(entityTarget: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName?: string): Alias {

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

        } else {
            let subQuery = "";
            if (entityTarget instanceof Function) {
                const subQueryBuilder: SelectQueryBuilder<any> = (entityTarget as any)(((this as any) as SelectQueryBuilder<any>).subQuery());
                this.setParameters(subQueryBuilder.getParameters());
                subQuery = subQueryBuilder.getQuery();

            } else {
                subQuery = entityTarget;
            }
            const isSubQuery = entityTarget instanceof Function || entityTarget.substr(0, 1) === "(" && entityTarget.substr(-1) === ")";
            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                tablePath: isSubQuery === false ? entityTarget as string : undefined,
                subQuery: isSubQuery === true ? subQuery : undefined,
            });
        }
    }

    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    protected replacePropertyNames(statement: string) {
        this.expressionMap.aliases.forEach(alias => {
            if (!alias.hasMetadata) return;
            const replaceAliasNamePrefix = this.expressionMap.aliasNamePrefixingEnabled ? alias.name + "\\." : "";
            const replacementAliasNamePrefix = this.expressionMap.aliasNamePrefixingEnabled ? this.escape(alias.name) + "." : "";
            alias.metadata.columns.forEach(column => {
                const expression = "([ =\(]|^.{0})" + replaceAliasNamePrefix + column.propertyPath + "([ =\)\,]|.{0}$)";
                statement = statement.replace(new RegExp(expression, "gm"), "$1" + replacementAliasNamePrefix + this.escape(column.databaseName) + "$2");
                const expression2 = "([ =\(]|^.{0})" + replaceAliasNamePrefix + column.propertyName + "([ =\)\,]|.{0}$)";
                statement = statement.replace(new RegExp(expression2, "gm"), "$1" + replacementAliasNamePrefix + this.escape(column.databaseName) + "$2");
            });
            alias.metadata.relations.forEach(relation => {
                [...relation.joinColumns, ...relation.inverseJoinColumns].forEach(joinColumn => {
                    const expression = "([ =\(]|^.{0})" + replaceAliasNamePrefix + relation.propertyPath + "\\." + joinColumn.referencedColumn!.propertyPath + "([ =\)\,]|.{0}$)";
                    statement = statement.replace(new RegExp(expression, "gm"), "$1" + replacementAliasNamePrefix + this.escape(joinColumn.databaseName) + "$2"); // todo: fix relation.joinColumns[0], what if multiple columns
                });
                if (relation.joinColumns.length > 0) {
                    const expression = "([ =\(]|^.{0})" + replaceAliasNamePrefix + relation.propertyPath + "([ =\)\,]|.{0}$)";
                    statement = statement.replace(new RegExp(expression, "gm"), "$1" + replacementAliasNamePrefix + this.escape(relation.joinColumns[0].databaseName) + "$2"); // todo: fix relation.joinColumns[0], what if multiple columns
                }
            });
        });
        return statement;
    }

    /**
     * Creates "WHERE" expression.
     */
    protected createWhereExpression() {
        let conditions = this.createWhereExpressionString();

        if (this.expressionMap.mainAlias!.hasMetadata) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            // Adds the global condition of "non-deleted" for the entity with delete date columns in select query.
            if (this.expressionMap.queryType === "select" && !this.expressionMap.withDeleted && metadata.deleteDateColumn) {
                const column = this.expressionMap.aliasNamePrefixingEnabled
                    ? this.expressionMap.mainAlias!.name + "." + metadata.deleteDateColumn.propertyName
                    : metadata.deleteDateColumn.propertyName;

                const condition = `${this.replacePropertyNames(column)} IS NULL`;
                conditions = `${conditions.length ? "(" + conditions + ") AND" : ""} ${condition}`;
            }

            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                const column = this.expressionMap.aliasNamePrefixingEnabled
                    ? this.expressionMap.mainAlias!.name + "." + metadata.discriminatorColumn.databaseName
                    : metadata.discriminatorColumn.databaseName;

                const condition = `${this.replacePropertyNames(column)} IN (:...discriminatorColumnValues)`;
                return ` WHERE ${conditions.length ? "(" + conditions + ") AND" : ""} ${condition}`;
            }
        }

        if (!conditions.length) // TODO copy in to discriminator condition
            return this.expressionMap.extraAppendedAndWhereCondition ? " WHERE " + this.replacePropertyNames(this.expressionMap.extraAppendedAndWhereCondition) : "";

        if (this.expressionMap.extraAppendedAndWhereCondition)
            return " WHERE (" + conditions + ") AND " + this.replacePropertyNames(this.expressionMap.extraAppendedAndWhereCondition);

        return " WHERE " + conditions;
    }

    /**
     * Creates "RETURNING" / "OUTPUT" expression.
     */
    protected createReturningExpression(): string {
        const columns = this.getReturningColumns();
        const driver = this.connection.driver;

        // also add columns we must auto-return to perform entity updation
        // if user gave his own returning
        if (typeof this.expressionMap.returning !== "string" &&
            this.expressionMap.extraReturningColumns.length > 0 &&
            driver.isReturningSqlSupported()) {
            columns.push(...this.expressionMap.extraReturningColumns.filter(column => {
                return columns.indexOf(column) === -1;
            }));
        }

        if (columns.length) {
            let columnsExpression = columns.map(column => {
                const name = this.escape(column.databaseName);
                if (driver.type === "SqlServerDriver") {
                    if (this.expressionMap.queryType === "insert" || this.expressionMap.queryType === "update" || this.expressionMap.queryType === "soft-delete" || this.expressionMap.queryType === "restore") {
                        return "INSERTED." + name;
                    } else {
                        return this.escape(this.getMainTableName()) + "." + name;
                    }
                } else {
                    return name;
                }
            }).join(", ");

            if (driver.type === "SqlServerDriver") {
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
     * Concatenates all added where expressions into one string.
     */
    protected createWhereExpressionString(): string {
        return this.expressionMap.wheres.map((where, index) => {
            switch (where.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + this.replacePropertyNames(where.condition);
                case "or":
                    return (index > 0 ? "OR " : "") + this.replacePropertyNames(where.condition);
                default:
                    return this.replacePropertyNames(where.condition);
            }
        }).join(" ");
    }

    /**
     * Creates "WHERE" expression and variables for the given "ids".
     */
    protected createWhereIdsExpression(ids: any | any[]): string {
        const metadata = this.expressionMap.mainAlias!.metadata;
        const normalized = (Array.isArray(ids) ? ids : [ids]).map(id => metadata.ensureEntityIdMap(id));

        // using in(...ids) for single primary key entities
        if (!metadata.hasMultiplePrimaryKeys
            && metadata.embeddeds.length === 0
        ) {
            const primaryColumn = metadata.primaryColumns[0];

            // getEntityValue will try to transform `In`, it is a bug
            // todo: remove this transformer check after #2390 is fixed
            if (!primaryColumn.transformer) {
                return this.computeWhereParameter({
                    [primaryColumn.propertyName]: In(
                        normalized.map(id => primaryColumn.getEntityValue(id, false))
                    )
                });
            }
        }

        // create shortcuts for better readability
        const alias = this.expressionMap.aliasNamePrefixingEnabled ? this.escape(this.expressionMap.mainAlias!.name) + "." : "";
        let parameterIndex = Object.keys(this.expressionMap.nativeParameters).length;
        const whereStrings = normalized.map((id, index) => {
            const whereSubStrings: string[] = [];
            metadata.primaryColumns.forEach((primaryColumn, secondIndex) => {
                const parameterName = "id_" + index + "_" + secondIndex;
                // whereSubStrings.push(alias + this.escape(primaryColumn.databaseName) + "=:id_" + index + "_" + secondIndex);
                whereSubStrings.push(alias + this.escape(primaryColumn.databaseName) + " = " + this.connection.driver.createParameter(parameterName, parameterIndex));
                this.expressionMap.nativeParameters[parameterName] = primaryColumn.getEntityValue(id, true);
                parameterIndex++;
            });
            return whereSubStrings.join(" AND ");
        });

        return whereStrings.length > 1
            ? "(" + whereStrings.map(whereString => "(" + whereString + ")").join(" OR ") + ")"
            : whereStrings[0];
    }

    /**
     * Computes given where argument - transforms to a where string all forms it can take.
     */
    protected computeWhereParameter(where: string | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[]) {
        if (typeof where === "string")
            return where;

        if (where instanceof Brackets) {
            const whereQueryBuilder = this.createQueryBuilder();
            where.whereFactory(whereQueryBuilder as any);
            const whereString = whereQueryBuilder.createWhereExpressionString();
            this.setParameters(whereQueryBuilder.getParameters());
            return whereString ? "(" + whereString + ")" : "";

        } else if (where instanceof Function) {
            return where(this);

        } else if (where instanceof Object) {
            const wheres: ObjectLiteral[] = Array.isArray(where) ? where : [where];
            let andConditions: string[];
            let parameterIndex = Object.keys(this.expressionMap.nativeParameters).length;

            if (this.expressionMap.mainAlias!.hasMetadata) {
                andConditions = wheres.map((where, whereIndex) => {
                    const propertyPaths = EntityMetadata.createPropertyPath(this.expressionMap.mainAlias!.metadata, where);

                    return propertyPaths.map((propertyPath, propertyIndex) => {
                        const columns = this.expressionMap.mainAlias!.metadata.findColumnsWithPropertyPath(propertyPath);

                        if (!columns.length) {
                            throw new EntityColumnNotFound(propertyPath);
                        }

                        return columns.map((column, columnIndex) => {

                            const aliasPath = this.expressionMap.aliasNamePrefixingEnabled ? `${this.alias}.${propertyPath}` : column.propertyPath;
                            const parameterValue = column.getEntityValue(where, true);
                            const parameterName = "where_" + whereIndex + "_" + propertyIndex + "_" + columnIndex;
                            const parameterBaseCount = Object.keys(this.expressionMap.nativeParameters).filter(x => x.startsWith(parameterName)).length;

                            if (parameterValue === null) {
                                return `${aliasPath} IS NULL`;

                            } else if (parameterValue instanceof FindOperator) {
                                const parameters: any[] = [];
                                if (parameterValue.useParameter) {
                                    const realParameterValues: any[] = parameterValue.multipleParameters ? parameterValue.value : [parameterValue.value];
                                    realParameterValues.forEach((realParameterValue, realParameterValueIndex) => {
                                        this.expressionMap.nativeParameters[parameterName + (parameterBaseCount + realParameterValueIndex)] = realParameterValue;
                                        parameterIndex++;
                                        parameters.push(this.connection.driver.createParameter(parameterName + (parameterBaseCount + realParameterValueIndex), parameterIndex - 1));
                                    });
                                }
                                return parameterValue.toSql(this.connection, aliasPath, parameters);

                            } else {
                                this.expressionMap.nativeParameters[parameterName] = parameterValue;
                                parameterIndex++;
                                const parameter = this.connection.driver.createParameter(parameterName, parameterIndex - 1);
                                return `${aliasPath} = ${parameter}`;
                            }

                        }).filter(expression => !!expression).join(" AND ");
                    }).filter(expression => !!expression).join(" AND ");
                });

            } else {
                andConditions = wheres.map((where, whereIndex) => {
                    return Object.keys(where).map((key, parameterIndex) => {
                        const parameterValue = where[key];
                        const aliasPath = this.expressionMap.aliasNamePrefixingEnabled ? `${this.alias}.${key}` : key;
                        if (parameterValue === null) {
                            return `${aliasPath} IS NULL`;

                        } else {
                            const parameterName = "where_" + whereIndex + "_" + parameterIndex;
                            this.expressionMap.nativeParameters[parameterName] = parameterValue;
                            parameterIndex++;
                            return `${aliasPath} = ${this.connection.driver.createParameter(parameterName, parameterIndex - 1)}`;
                        }
                    }).join(" AND ");
                });
            }

            if (andConditions.length > 1)
                return andConditions.map(where => "(" + where + ")").join(" OR ");

            return andConditions.join("");
        }

        return "";
    }

    /**
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    protected obtainQueryRunner() {
        return this.queryRunner || this.connection.createQueryRunner("master");
    }

}

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class UpdateQueryBuilder<Entity> extends QueryBuilder<Entity> implements WhereExpression {

    SelectQueryBuilderCls = SelectQueryBuilder;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOrQueryBuilder: Connection | QueryBuilder<any>, queryRunner?: QueryRunner) {
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
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        return sql.trim();
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<UpdateResult> {
        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;

        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            // call before updation methods in listeners and subscribers
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias!.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                queryRunner.broadcaster.broadcastBeforeUpdateEvent(broadcastResult, this.expressionMap.mainAlias!.metadata, this.expressionMap.valuesSet);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            let declareSql: string | null = null;
            let selectOutputSql: string | null = null;

            // if update entity mode is enabled we may need extra columns for the returning statement
            const returningResultsEntityUpdator = new ReturningResultsEntityUpdator(queryRunner, this.expressionMap);
            if (this.expressionMap.updateEntity === true &&
                this.expressionMap.mainAlias!.hasMetadata &&
                this.expressionMap.whereEntities.length > 0) {
                this.expressionMap.extraReturningColumns = returningResultsEntityUpdator.getUpdationReturningColumns();

                if (this.expressionMap.extraReturningColumns.length > 0 && this.connection.driver.type === "SqlServerDriver") {
                    declareSql = this.connection.driver.buildTableVariableDeclaration("@OutputTable", this.expressionMap.extraReturningColumns);
                    selectOutputSql = `SELECT * FROM @OutputTable`;
                }
            }

            // execute update query
            const [updateSql, parameters] = this.getQueryAndParameters();
            const updateResult = new UpdateResult();
            const statements = [declareSql, updateSql, selectOutputSql];
            const result = await queryRunner.query(
                statements.filter(sql => sql != null).join(";\n\n"),
                parameters,
            );

            if (this.connection.driver.type === "PostgresDriver") {
                updateResult.raw = result[0];
                updateResult.affected = result[1];
            } else if (this.connection.driver.type === "MysqlDriver") {
                updateResult.raw = result;
                updateResult.affected = result.affectedRows;
            } else {
                updateResult.raw = result;
            }

            // if we are updating entities and entity updation is enabled we must update some of entity columns (like version, update date, etc.)
            if (this.expressionMap.updateEntity === true &&
                this.expressionMap.mainAlias!.hasMetadata &&
                this.expressionMap.whereEntities.length > 0) {
                await returningResultsEntityUpdator.update(updateResult, this.expressionMap.whereEntities);
            }

            // call after updation methods in listeners and subscribers
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias!.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                queryRunner.broadcaster.broadcastAfterUpdateEvent(broadcastResult, this.expressionMap.mainAlias!.metadata);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            // close transaction if we started it
            if (transactionStartedByUs)
                await queryRunner.commitTransaction();

            return updateResult;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {
            if (queryRunner !== this.queryRunner) { // means we created our own query runner
                await queryRunner.release();
            }
            if (this.connection.driver.autoSave && !queryRunner.isTransactionActive) {
                await this.connection.driver.autoSave();
            }
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Values needs to be updated.
     */
    set(values: QueryDeepPartialEntity<Entity>): this {
        this.expressionMap.valuesSet = values;
        return this;
    }

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        this.expressionMap.wheres = []; // don't move this block below since computeWhereParameter can add where expressions
        const condition = this.computeWhereParameter(where);
        if (condition)
            this.expressionMap.wheres = [{type: "simple", condition: condition}];
        if (parameters)
            this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string | ((qb: this) => string) | Brackets, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({type: "and", condition: this.computeWhereParameter(where)});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: string | ((qb: this) => string) | Brackets, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({type: "or", condition: this.computeWhereParameter(where)});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    whereInIds(ids: any | any[]): this {
        return this.where(this.createWhereIdsExpression(ids));
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    andWhereInIds(ids: any | any[]): this {
        return this.andWhere(this.createWhereIdsExpression(ids));
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     */
    orWhereInIds(ids: any | any[]): this {
        return this.orWhere(this.createWhereIdsExpression(ids));
    }

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
    output(output: string | string[]): this;

    /**
     * Optional returning/output clause.
     */
    output(output: string | string[]): this {
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
    returning(returning: string | string[]): this;

    /**
     * Optional returning/output clause.
     */
    returning(returning: string | string[]): this {

        // not all databases support returning/output cause
        if (!this.connection.driver.isReturningSqlSupported())
            throw new ReturningStatementNotSupportedError();

        this.expressionMap.returning = returning;
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
    orderBy(sort: string, order?: "ASC" | "DESC", nulls?: "NULLS FIRST" | "NULLS LAST"): this;

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
    orderBy(sort?: string | OrderByCondition, order: "ASC" | "DESC" = "ASC", nulls?: "NULLS FIRST" | "NULLS LAST"): this {
        if (sort) {
            if (sort instanceof Object) {
                this.expressionMap.orderBys = sort as OrderByCondition;
            } else {
                if (nulls) {
                    this.expressionMap.orderBys = {[sort as string]: {order, nulls}};
                } else {
                    this.expressionMap.orderBys = {[sort as string]: order};
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
    addOrderBy(sort: string, order: "ASC" | "DESC" = "ASC", nulls?: "NULLS FIRST" | "NULLS LAST"): this {
        if (nulls) {
            this.expressionMap.orderBys[sort] = {order, nulls};
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
    whereEntity(entity: Entity | Entity[]): this {
        if (!this.expressionMap.mainAlias!.hasMetadata)
            throw new Error(`.whereEntity method can only be used on queries which update real entity table.`);

        this.expressionMap.wheres = [];
        const entities: Entity[] = Array.isArray(entity) ? entity : [entity];
        entities.forEach(entity => {

            const entityIdMap = this.expressionMap.mainAlias!.metadata.getEntityIdMap(entity);
            if (!entityIdMap)
                throw new Error(`Provided entity does not have ids set, cannot perform operation.`);

            this.orWhereInIds(entityIdMap);
        });

        this.expressionMap.whereEntities = entities;
        return this;
    }

    /**
     * Indicates if entity must be updated after update operation.
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
     * Creates UPDATE express used to perform insert query.
     */
    protected createUpdateExpression() {
        const valuesSet = this.getValueSet();
        const metadata = this.expressionMap.mainAlias!.hasMetadata ? this.expressionMap.mainAlias!.metadata : undefined;

        // prepare columns and values to be updated
        const updateColumnAndValues: string[] = [];
        const updatedColumns: ColumnMetadata[] = [];
        const newParameters: ObjectLiteral = {};
        let parametersCount = this.connection.driver.type === "MysqlDriver" ||
        this.connection.driver.type === "AuroraDataApiDriver" ||
        this.connection.driver.type === "OracleDriver" ||
        this.connection.driver.type === "AbstractSqliteDriver" ||
        this.connection.driver.type === "SapDriver"
            ? 0 : Object.keys(this.expressionMap.nativeParameters).length;
        if (metadata) {
            EntityMetadata.createPropertyPath(metadata, valuesSet).forEach(propertyPath => {
                // todo: make this and other query builder to work with properly with tables without metadata
                const columns = metadata.findColumnsWithPropertyPath(propertyPath);

                if (columns.length <= 0) {
                    throw new EntityColumnNotFound(propertyPath);
                }

                columns.forEach(column => {
                    if (!column.isUpdate) { return; }
                    updatedColumns.push(column);

                    const paramName = "upd_" + column.databaseName;

                    //
                    let value = column.getEntityValue(valuesSet);
                    if (column.referencedColumn && value instanceof Object) {
                        value = column.referencedColumn.getEntityValue(value);
                    } else if (!(value instanceof Function)) {
                        value = this.connection.driver.preparePersistentValue(value, column);
                    }

                    // todo: duplication zone
                    if (value instanceof Function) { // support for SQL expressions in update query
                        updateColumnAndValues.push(this.escape(column.databaseName) + " = " + value());
                    } else if (this.connection.driver.type === "SapDriver" && value === null) {
                        updateColumnAndValues.push(this.escape(column.databaseName) + " = NULL");
                    } else {
                        if (this.connection.driver.type === "SqlServerDriver") {
                            value = this.connection.driver.parametrizeValue(column, value);

                            // } else if (value instanceof Array) {
                            //     value = new ArrayParameter(value);
                        }

                        if (this.connection.driver.type === "MysqlDriver" ||
                            this.connection.driver.type === "AuroraDataApiDriver" ||
                            this.connection.driver.type === "OracleDriver" ||
                            this.connection.driver.type === "AbstractSqliteDriver" ||
                            this.connection.driver.type === "SapDriver") {
                            newParameters[paramName] = value;
                        } else {
                            this.expressionMap.nativeParameters[paramName] = value;
                        }

                        let expression = null;
                        if ((this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver") && this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                            const useLegacy = this.connection.driver.options.legacySpatialSupport;
                            const geomFromText = useLegacy ? "GeomFromText" : "ST_GeomFromText";
                            if (column.srid != null) {
                                expression = `${geomFromText}(${this.connection.driver.createParameter(paramName, parametersCount)}, ${column.srid})`;
                            } else {
                                expression = `${geomFromText}(${this.connection.driver.createParameter(paramName, parametersCount)})`;
                            }
                        } else if (this.connection.driver.type === "PostgresDriver" && this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                            if (column.srid != null) {
                                expression = `ST_SetSRID(ST_GeomFromGeoJSON(${this.connection.driver.createParameter(paramName, parametersCount)}), ${column.srid})::${column.type}`;
                            } else {
                                expression = `ST_GeomFromGeoJSON(${this.connection.driver.createParameter(paramName, parametersCount)})::${column.type}`;
                            }
                        } else if (this.connection.driver.type === "SqlServerDriver" && this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                            expression = column.type + "::STGeomFromText(" + this.connection.driver.createParameter(paramName, parametersCount) + ", " + (column.srid || "0") + ")";
                        } else {
                            expression = this.connection.driver.createParameter(paramName, parametersCount);
                        }
                        updateColumnAndValues.push(this.escape(column.databaseName) + " = " + expression);
                        parametersCount++;
                    }
                });
            });

            if (metadata.versionColumn && updatedColumns.indexOf(metadata.versionColumn) === -1)
                updateColumnAndValues.push(this.escape(metadata.versionColumn.databaseName) + " = " + this.escape(metadata.versionColumn.databaseName) + " + 1");
            if (metadata.updateDateColumn && updatedColumns.indexOf(metadata.updateDateColumn) === -1)
                updateColumnAndValues.push(this.escape(metadata.updateDateColumn.databaseName) + " = CURRENT_TIMESTAMP"); // todo: fix issue with CURRENT_TIMESTAMP(6) being used, can "DEFAULT" be used?!

        } else {
            Object.keys(valuesSet).map(key => {
                const value = valuesSet[key];

                // todo: duplication zone
                if (value instanceof Function) { // support for SQL expressions in update query
                    updateColumnAndValues.push(this.escape(key) + " = " + value());
                } else if (this.connection.driver.type === "SapDriver" && value === null) {
                    updateColumnAndValues.push(this.escape(key) + " = NULL");
                } else {

                    // we need to store array values in a special class to make sure parameter replacement will work correctly
                    // if (value instanceof Array)
                    //     value = new ArrayParameter(value);

                    if (this.connection.driver.type === "MysqlDriver" ||
                        this.connection.driver.type === "AuroraDataApiDriver" ||
                        this.connection.driver.type === "OracleDriver" ||
                        this.connection.driver.type === "AbstractSqliteDriver" ||
                        this.connection.driver.type === "SapDriver") {
                        newParameters[key] = value;
                    } else {
                        this.expressionMap.nativeParameters[key] = value;
                    }

                    updateColumnAndValues.push(this.escape(key) + " = " + this.connection.driver.createParameter(key, parametersCount));
                    parametersCount++;
                }
            });
        }

        if (updateColumnAndValues.length <= 0) {
            throw new UpdateValuesMissingError();
        }

        // we re-write parameters this way because we want our "UPDATE ... SET" parameters to be first in the list of "nativeParameters"
        // because some drivers like mysql depend on order of parameters
        if (this.connection.driver.type === "MysqlDriver" ||
            this.connection.driver.type === "AuroraDataApiDriver" ||
            this.connection.driver.type === "OracleDriver" ||
            this.connection.driver.type === "AbstractSqliteDriver" ||
            this.connection.driver.type === "SapDriver") {
            this.expressionMap.nativeParameters = Object.assign(newParameters, this.expressionMap.nativeParameters);
        }

        // get a table name and all column database names
        const whereExpression = this.createWhereExpression();
        const returningExpression = this.createReturningExpression();

        // generate and return sql update query
        if (returningExpression && (this.connection.driver.type === "PostgresDriver" || this.connection.driver.type === "OracleDriver" || this.connection.driver.type === "CockroachDriver")) {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")}${whereExpression} RETURNING ${returningExpression}`;

        } else if (returningExpression && this.connection.driver.type === "SqlServerDriver") {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")} OUTPUT ${returningExpression}${whereExpression}`;

        } else {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")}${whereExpression}`; // todo: how do we replace aliases in where to nothing?
        }
    }

    /**
     * Creates "ORDER BY" part of SQL query.
     */
    protected createOrderByExpression() {
        const orderBys = this.expressionMap.orderBys;
        if (Object.keys(orderBys).length > 0)
            return " ORDER BY " + Object.keys(orderBys)
                .map(columnName => {
                    if (typeof orderBys[columnName] === "string") {
                        return this.replacePropertyNames(columnName) + " " + orderBys[columnName];
                    } else {
                        return this.replacePropertyNames(columnName) + " " + (orderBys[columnName] as any).order + " " + (orderBys[columnName] as any).nulls;
                    }
                })
                .join(", ");

        return "";
    }

    /**
     * Creates "LIMIT" parts of SQL query.
     */
    protected createLimitExpression(): string {
        const limit: number | undefined = this.expressionMap.limit;

        if (limit) {
            if (this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver") {
                return " LIMIT " + limit;
            } else {
                throw new LimitOnUpdateNotSupportedError();
            }
        }

        return "";
    }

    /**
     * Gets array of values need to be inserted into the target table.
     */
    protected getValueSet(): ObjectLiteral {
        if (this.expressionMap.valuesSet instanceof Object)
            return this.expressionMap.valuesSet;

        throw new UpdateValuesMissingError();
    }

}

/**
 * Allows to work with entity relations and perform specific operations with those relations.
 *
 * todo: add transactions everywhere
 */
export class RelationQueryBuilder<Entity> extends QueryBuilder<Entity> {

    SelectQueryBuilderCls = SelectQueryBuilder;

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        return "";
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Sets entity (target) which relations will be updated.
     */
    of(entity: any | any[]): this {
        this.expressionMap.of = entity;
        return this;
    }

    /**
     * Sets entity relation's value.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Works only for many-to-one and one-to-one relations.
     * For many-to-many and one-to-many relations use #add and #remove methods instead.
     */
    async set(value: any): Promise<void> {
        const relation = this.expressionMap.relationMetadata;

        if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
            throw new Error(`Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.`);

        if (relation.isManyToMany || relation.isOneToMany)
            throw new Error(`Set operation is only supported for many-to-one and one-to-one relations. ` +
                `However given "${relation.propertyPath}" has ${relation.relationType} relation. ` +
                `Use .add() method instead.`);

        // if there are multiple join columns then user must send id map as "value" argument. check if he really did it
        if (relation.joinColumns &&
            relation.joinColumns.length > 1 &&
            (!(value instanceof Object) || Object.keys(value).length < relation.joinColumns.length))
            throw new Error(`Value to be set into the relation must be a map of relation ids, for example: .set({ firstName: "...", lastName: "..." })`);

        const updater = new RelationUpdater(this, this.expressionMap);
        return updater.update(value);
    }

    /**
     * Adds (binds) given value to entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    async add(value: any | any[]): Promise<void> {
        if (Array.isArray(value) && value.length === 0)
            return;

        const relation = this.expressionMap.relationMetadata;

        if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
            throw new Error(`Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.`);

        if (relation.isManyToOne || relation.isOneToOne)
            throw new Error(`Add operation is only supported for many-to-many and one-to-many relations. ` +
                `However given "${relation.propertyPath}" has ${relation.relationType} relation. ` +
                `Use .set() method instead.`);

        // if there are multiple join columns then user must send id map as "value" argument. check if he really did it
        if (relation.joinColumns &&
            relation.joinColumns.length > 1 &&
            (!(value instanceof Object) || Object.keys(value).length < relation.joinColumns.length))
            throw new Error(`Value to be set into the relation must be a map of relation ids, for example: .set({ firstName: "...", lastName: "..." })`);

        const updater = new RelationUpdater(this, this.expressionMap);
        return updater.update(value);
    }

    /**
     * Removes (unbinds) given value from entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    async remove(value: any | any[]): Promise<void> {
        if (Array.isArray(value) && value.length === 0)
            return;

        const relation = this.expressionMap.relationMetadata;

        if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
            throw new Error(`Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.`);

        if (relation.isManyToOne || relation.isOneToOne)
            throw new Error(`Add operation is only supported for many-to-many and one-to-many relations. ` +
                `However given "${relation.propertyPath}" has ${relation.relationType} relation. ` +
                `Use .set(null) method instead.`);

        const remover = new RelationRemover(this, this.expressionMap);
        return remover.remove(value);
    }

    /**
     * Adds (binds) and removes (unbinds) given values to/from entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    async addAndRemove(added: any | any[], removed: any | any[]): Promise<void> {
        await this.remove(removed);
        await this.add(added);
    }

    /**
     * Gets entity's relation id.
     async getId(): Promise<any> {

    }*/

    /**
     * Gets entity's relation ids.
     async getIds(): Promise<any[]> {
        return [];
    }*/

    /**
     * Loads a single entity (relational) from the relation.
     * You can also provide id of relational entity to filter by.
     */
    async loadOne<T = any>(): Promise<T | undefined> {
        return this.loadMany<T>().then(results => results[0]);
    }

    /**
     * Loads many entities (relational) from the relation.
     * You can also provide ids of relational entities to filter by.
     */
    async loadMany<T = any>(): Promise<T[]> {
        let of = this.expressionMap.of;
        if (!(of instanceof Object)) {
            const metadata = this.expressionMap.mainAlias!.metadata;
            if (metadata.hasMultiplePrimaryKeys)
                throw new Error(`Cannot load entity because only one primary key was specified, however entity contains multiple primary keys`);

            of = metadata.primaryColumns[0].createValueMap(of);
        }

        return this.connection.relationLoader.load(this.expressionMap.relationMetadata, of);
    }

}

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class DeleteQueryBuilder<Entity> extends QueryBuilder<Entity> implements WhereExpression {

    SelectQueryBuilderCls = SelectQueryBuilder;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOrQueryBuilder: Connection | QueryBuilder<any>, queryRunner?: QueryRunner) {
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
        const sql = this.createDeleteExpression();
        return sql.trim();
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<DeleteResult> {
        const [sql, parameters] = this.getQueryAndParameters();
        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;

        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            // call before deletion methods in listeners and subscribers
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias!.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                queryRunner.broadcaster.broadcastBeforeRemoveEvent(broadcastResult, this.expressionMap.mainAlias!.metadata);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            // execute query
            const deleteResult = new DeleteResult();
            const result = await queryRunner.query(sql, parameters);

            const driver = queryRunner.connection.driver;
            if (driver.type === "MysqlDriver" || driver.type === "AuroraDataApiDriver") {
                deleteResult.raw = result;
                deleteResult.affected = result.affectedRows;

            } else if (driver.type === "SqlServerDriver" || driver.type === "PostgresDriver" || driver.type === "CockroachDriver") {
                deleteResult.raw = result[0] ? result[0] : null;
                // don't return 0 because it could confuse. null means that we did not receive this value
                deleteResult.affected = typeof result[1] === "number" ? result[1] : null;

            } else if (driver.type === "OracleDriver") {
                deleteResult.affected = result;

            } else {
                deleteResult.raw = result;
            }

            // call after deletion methods in listeners and subscribers
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias!.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                queryRunner.broadcaster.broadcastAfterRemoveEvent(broadcastResult, this.expressionMap.mainAlias!.metadata);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            // close transaction if we started it
            if (transactionStartedByUs)
                await queryRunner.commitTransaction();

            return deleteResult;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {
            if (queryRunner !== this.queryRunner) { // means we created our own query runner
                await queryRunner.release();
            }
            if (this.connection.driver.autoSave && !queryRunner.isTransactionActive) {
                await this.connection.driver.autoSave();
            }
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    from<T>(entityTarget: ObjectType<T> | EntitySchema<T> | string, aliasName?: string): DeleteQueryBuilder<T> {
        entityTarget = entityTarget instanceof EntitySchema ? entityTarget.options.name : entityTarget;
        const mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return (this as any) as DeleteQueryBuilder<T>;
    }

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: Brackets | string | ((qb: this) => string) | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        this.expressionMap.wheres = []; // don't move this block below since computeWhereParameter can add where expressions
        const condition = this.computeWhereParameter(where);
        if (condition)
            this.expressionMap.wheres = [{type: "simple", condition: condition}];
        if (parameters)
            this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: Brackets | string | ((qb: this) => string), parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({type: "and", condition: this.computeWhereParameter(where)});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: Brackets | string | ((qb: this) => string), parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({type: "or", condition: this.computeWhereParameter(where)});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    whereInIds(ids: any | any[]): this {
        return this.where(this.createWhereIdsExpression(ids));
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    andWhereInIds(ids: any | any[]): this {
        return this.andWhere(this.createWhereIdsExpression(ids));
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     */
    orWhereInIds(ids: any | any[]): this {
        return this.orWhere(this.createWhereIdsExpression(ids));
    }

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
    output(output: string | string[]): this;

    /**
     * Optional returning/output clause.
     */
    output(output: string | string[]): this {
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
    returning(returning: string | string[]): this;

    /**
     * Optional returning/output clause.
     */
    returning(returning: string | string[]): this {

        // not all databases support returning/output cause
        if (!this.connection.driver.isReturningSqlSupported())
            throw new ReturningStatementNotSupportedError();

        this.expressionMap.returning = returning;
        return this;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates DELETE express used to perform query.
     */
    protected createDeleteExpression() {
        const tableName = this.getTableName(this.getMainTableName());
        const whereExpression = this.createWhereExpression();
        const returningExpression = this.createReturningExpression();

        if (returningExpression && (this.connection.driver.type === "PostgresDriver" || this.connection.driver.type === "CockroachDriver")) {
            return `DELETE FROM ${tableName}${whereExpression} RETURNING ${returningExpression}`;

        } else if (returningExpression !== "" && this.connection.driver.type === "SqlServerDriver") {
            return `DELETE FROM ${tableName} OUTPUT ${returningExpression}${whereExpression}`;

        } else {
            return `DELETE FROM ${tableName}${whereExpression}`;
        }
    }

}

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class SelectQueryBuilder<Entity> extends QueryBuilder<Entity> implements WhereExpression {

    SelectQueryBuilderCls = SelectQueryBuilder;

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitOffsetExpression();
        sql += this.createLockExpression();
        sql = sql.trim();
        if (this.expressionMap.subQuery)
            sql = "(" + sql + ")";
        return sql;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a subquery - query that can be used inside other queries.
     */
    subQuery(): SelectQueryBuilder<any> {
        const qb = this.createQueryBuilder();
        qb.expressionMap.subQuery = true;
        qb.expressionMap.parentQueryBuilder = this;
        return qb;
    }

    /**
     * Creates SELECT query.
     * Replaces all previous selections if they exist.
     */
    select(): this;

    /**
     * Creates SELECT query.
     * Replaces all previous selections if they exist.
     */
    select(selection: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, selectionAliasName?: string): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string, selectionAliasName?: string): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection: string[]): this;

    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    select(selection?: string | string[] | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), selectionAliasName?: string): SelectQueryBuilder<Entity> {
        this.expressionMap.queryType = "select";
        if (Array.isArray(selection)) {
            this.expressionMap.selects = selection.map(selection => ({selection: selection}));

        } else if (selection instanceof Function) {
            const subQueryBuilder = selection(this.subQuery());
            this.setParameters(subQueryBuilder.getParameters());
            this.expressionMap.selects.push({selection: subQueryBuilder.getQuery(), aliasName: selectionAliasName});

        } else if (selection) {
            this.expressionMap.selects = [{selection: selection, aliasName: selectionAliasName}];
        }

        return this;
    }

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, selectionAliasName?: string): this;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string, selectionAliasName?: string): this;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string[]): this;

    /**
     * Adds new selection to the SELECT query.
     */
    addSelect(selection: string | string[] | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), selectionAliasName?: string): this {
        if (!selection)
            return this;

        if (Array.isArray(selection)) {
            this.expressionMap.selects = this.expressionMap.selects.concat(selection.map(selection => ({selection: selection})));

        } else if (selection instanceof Function) {
            const subQueryBuilder = selection(this.subQuery());
            this.setParameters(subQueryBuilder.getParameters());
            this.expressionMap.selects.push({selection: subQueryBuilder.getQuery(), aliasName: selectionAliasName});

        } else if (selection) {
            this.expressionMap.selects.push({selection: selection, aliasName: selectionAliasName});
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
    distinctOn(distinctOn: string[]): this {
        this.expressionMap.selectDistinctOn = distinctOn;
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
    from<T>(entityTarget: ObjectType<T> | string, aliasName: string): SelectQueryBuilder<T>;

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     * Removes all previously set from-s.
     */
    from<T>(entityTarget: ObjectType<T> | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName: string): SelectQueryBuilder<T> {
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
    addFrom<T>(entityTarget: ObjectType<T> | string, aliasName: string): SelectQueryBuilder<T>;

    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    addFrom<T>(entityTarget: ObjectType<T> | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName: string): SelectQueryBuilder<T> {
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
    innerJoin(subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs (without selection) entity's property.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs (without selection) given entity's table.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(entity: Function | string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs (without selection) given table.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(tableName: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs (without selection).
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoin(entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition: string = "", parameters?: ObjectLiteral): this {
        this.join("INNER", entityOrProperty, alias, condition, parameters);
        return this;
    }

    /**
     * LEFT JOINs (without selection) given subquery.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs (without selection) entity's property.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs (without selection) entity's table.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(entity: Function | string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs (without selection) given table.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(tableName: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs (without selection).
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoin(entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition: string = "", parameters?: ObjectLiteral): this {
        this.join("LEFT", entityOrProperty, alias, condition, parameters);
        return this;
    }

    /**
     * INNER JOINs given subquery and adds all selection properties to SELECT..
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs entity's property and adds all selection properties to SELECT.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs entity and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(entity: Function | string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs table and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(tableName: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndSelect(entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition: string = "", parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        this.innerJoin(entityOrProperty, alias, condition, parameters);
        return this;
    }

    /**
     * LEFT JOINs given subquery and adds all selection properties to SELECT..
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs entity's property and adds all selection properties to SELECT.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs entity and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(entity: Function | string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs table and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(tableName: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndSelect(entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition: string = "", parameters?: ObjectLiteral): this {
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
    innerJoinAndMapMany(mapToProperty: string, subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs entity's property, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs entity's table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, entity: Function | string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, tableName: string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapMany(mapToProperty: string, entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition: string = "", parameters?: ObjectLiteral): this {
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
    innerJoinAndMapOne(mapToProperty: string, subQueryFactory: (qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs entity's property, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs entity's table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, entity: Function | string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, tableName: string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * INNER JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    innerJoinAndMapOne(mapToProperty: string, entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition: string = "", parameters?: ObjectLiteral): this {
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

    /**
     * LEFT JOINs entity's property, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs entity's table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, entity: Function | string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, tableName: string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapMany(mapToProperty: string, entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition: string = "", parameters?: ObjectLiteral): this {
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

    /**
     * LEFT JOINs entity's property, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * Given entity property should be a relation.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, property: string, alias: string, condition?: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs entity's table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, entity: Function | string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs table, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, tableName: string, alias: string, condition: string, parameters?: ObjectLiteral): this;

    /**
     * LEFT JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    leftJoinAndMapOne(mapToProperty: string, entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), alias: string, condition: string = "", parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        this.join("LEFT", entityOrProperty, alias, condition, parameters, mapToProperty, false);
        return this;
    }

    /**
     */
    // selectAndMap(mapToProperty: string, property: string, aliasName: string, qbFactory: ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>)): this;

    /**
     */
    // selectAndMap(mapToProperty: string, entity: Function|string, aliasName: string, qbFactory: ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>)): this;

    /**
     */
    // selectAndMap(mapToProperty: string, tableName: string, aliasName: string, qbFactory: ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>)): this;

    /**
     */
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
                         aliasNameOrOptions?: string | { disableMixedMap?: boolean },
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

        if (relationIdAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                type: "other",
                name: relationIdAttribute.junctionAlias,
                metadata: relationIdAttribute.relation.junctionEntityMetadata
            });
        }
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

        this.expressionMap.createAlias({
            type: "other",
            name: relationCountAttribute.junctionAlias
        });
        if (relationCountAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                type: "other",
                name: relationCountAttribute.junctionAlias,
                metadata: relationCountAttribute.relation.junctionEntityMetadata
            });
        }
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
    where(where: Brackets | string | ((qb: this) => string) | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        this.expressionMap.wheres = []; // don't move this block below since computeWhereParameter can add where expressions
        const condition = this.computeWhereParameter(where);
        if (condition)
            this.expressionMap.wheres = [{type: "simple", condition: condition}];
        if (parameters)
            this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string | Brackets | ((qb: this) => string), parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({type: "and", condition: this.computeWhereParameter(where)});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: Brackets | string | ((qb: this) => string), parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({type: "or", condition: this.computeWhereParameter(where)});
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
    whereInIds(ids: any | any[]): this {
        return this.where(this.createWhereIdsExpression(ids));
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    andWhereInIds(ids: any | any[]): this {
        return this.andWhere(this.createWhereIdsExpression(ids));
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    orWhereInIds(ids: any | any[]): this {
        return this.orWhere(this.createWhereIdsExpression(ids));
    }

    /**
     * Sets HAVING condition in the query builder.
     * If you had previously HAVING expression defined,
     * calling this function will override previously set HAVING conditions.
     * Additionally you can add parameters used in where expression.
     */
    having(having: string, parameters?: ObjectLiteral): this {
        this.expressionMap.havings.push({type: "simple", condition: having});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND HAVING condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andHaving(having: string, parameters?: ObjectLiteral): this {
        this.expressionMap.havings.push({type: "and", condition: having});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR HAVING condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orHaving(having: string, parameters?: ObjectLiteral): this {
        this.expressionMap.havings.push({type: "or", condition: having});
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
    groupBy(groupBy?: string): this {
        if (groupBy) {
            this.expressionMap.groupBys = [groupBy];
        } else {
            this.expressionMap.groupBys = [];
        }
        return this;
    }

    /**
     * Adds GROUP BY condition in the query builder.
     */
    addGroupBy(groupBy: string): this {
        this.expressionMap.groupBys.push(groupBy);
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
    orderBy(sort: string, order?: "ASC" | "DESC", nulls?: "NULLS FIRST" | "NULLS LAST"): this;

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
    orderBy(sort?: string | OrderByCondition, order: "ASC" | "DESC" = "ASC", nulls?: "NULLS FIRST" | "NULLS LAST"): this {
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            throw new Error(`SelectQueryBuilder.addOrderBy "order" can accept only "ASC" and "DESC" values.`);
        if (nulls !== undefined && nulls !== "NULLS FIRST" && nulls !== "NULLS LAST")
            throw new Error(`SelectQueryBuilder.addOrderBy "nulls" can accept only "NULLS FIRST" and "NULLS LAST" values.`);

        if (sort) {
            if (sort instanceof Object) {
                this.expressionMap.orderBys = sort as OrderByCondition;
            } else {
                if (nulls) {
                    this.expressionMap.orderBys = {[sort as string]: {order, nulls}};
                } else {
                    this.expressionMap.orderBys = {[sort as string]: order};
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
    addOrderBy(sort: string, order: "ASC" | "DESC" = "ASC", nulls?: "NULLS FIRST" | "NULLS LAST"): this {
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            throw new Error(`SelectQueryBuilder.addOrderBy "order" can accept only "ASC" and "DESC" values.`);
        if (nulls !== undefined && nulls !== "NULLS FIRST" && nulls !== "NULLS LAST")
            throw new Error(`SelectQueryBuilder.addOrderBy "nulls" can accept only "NULLS FIRST" and "NULLS LAST" values.`);

        if (nulls) {
            this.expressionMap.orderBys[sort] = {order, nulls};
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
    setLock(lockMode: "optimistic", lockVersion: number): this;

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "optimistic", lockVersion: Date): this;

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "pessimistic_read" | "pessimistic_write" | "dirty_read" | "pessimistic_partial_write" | "pessimistic_write_or_fail" | "for_no_key_update"): this;

    /**
     * Sets locking mode.
     */
    setLock(lockMode: "optimistic" | "pessimistic_read" | "pessimistic_write" | "dirty_read" | "pessimistic_partial_write" | "pessimistic_write_or_fail" | "for_no_key_update", lockVersion?: number | Date): this {
        this.expressionMap.lockMode = lockMode;
        this.expressionMap.lockVersion = lockVersion;
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
        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;
        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            const results = await this.loadRawResults(queryRunner);

            // close transaction if we started it
            if (transactionStartedByUs) {
                await queryRunner.commitTransaction();
            }

            return results;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {
            if (queryRunner !== this.queryRunner) { // means we created our own query runner
                await queryRunner.release();
            }
        }
    }

    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    async getRawAndEntities<T = any>(): Promise<{ entities: Entity[], raw: T[] }> {
        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;
        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            this.expressionMap.queryEntity = true;
            const results = await this.executeEntitiesAndRawResults(queryRunner);

            // close transaction if we started it
            if (transactionStartedByUs) {
                await queryRunner.commitTransaction();
            }

            return results;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {
            if (queryRunner !== this.queryRunner) // means we created our own query runner
                await queryRunner.release();
        }
    }

    /**
     * Gets single entity returned by execution of generated query builder sql.
     */
    async getOne(): Promise<Entity | undefined> {
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

        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;
        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            this.expressionMap.queryEntity = false;
            const results = await this.executeCountQuery(queryRunner);

            // close transaction if we started it
            if (transactionStartedByUs) {
                await queryRunner.commitTransaction();
            }

            return results;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {
            if (queryRunner !== this.queryRunner) // means we created our own query runner
                await queryRunner.release();
        }
    }

    /**
     * Executes built SQL query and returns entities and overall entities count (without limitation).
     * This method is useful to build pagination.
     */
    async getManyAndCount(): Promise<[Entity[], number]> {
        if (this.expressionMap.lockMode === "optimistic")
            throw new OptimisticLockCanNotBeUsedError();

        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;
        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            this.expressionMap.queryEntity = true;
            const entitiesAndRaw = await this.executeEntitiesAndRawResults(queryRunner);
            this.expressionMap.queryEntity = false;
            const count = await this.executeCountQuery(queryRunner);
            const results: [Entity[], number] = [entitiesAndRaw.entities, count];

            // close transaction if we started it
            if (transactionStartedByUs) {
                await queryRunner.commitTransaction();
            }

            return results;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {
            if (queryRunner !== this.queryRunner) // means we created our own query runner
                await queryRunner.release();
        }
    }

    /**
     * Executes built SQL query and returns raw data stream.
     */
    async stream(): Promise<ReadStream> {
        this.expressionMap.queryEntity = false;
        const [sql, parameters] = this.getQueryAndParameters();
        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;
        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            const releaseFn = () => {
                if (queryRunner !== this.queryRunner) // means we created our own query runner
                    return queryRunner.release();
                return;
            };
            const results = queryRunner.stream(sql, parameters, releaseFn, releaseFn);

            // close transaction if we started it
            if (transactionStartedByUs) {
                await queryRunner.commitTransaction();
            }

            return results;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {
            if (queryRunner !== this.queryRunner) // means we created our own query runner
                await queryRunner.release();
        }
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
    cache(enabledOrMillisecondsOrId: boolean | number | string, maybeMilliseconds?: number): this {

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

    protected join(direction: "INNER" | "LEFT",
                   entityOrProperty: Function | string | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>),
                   aliasName: string,
                   condition?: string,
                   parameters?: ObjectLiteral,
                   mapToProperty?: string,
                   isMappingMany?: boolean): void {

        this.setParameters(parameters || {});

        const joinAttribute = new JoinAttribute(this.connection, this.expressionMap);
        joinAttribute.direction = direction;
        joinAttribute.mapToProperty = mapToProperty;
        joinAttribute.isMappingMany = isMappingMany;
        joinAttribute.entityOrProperty = entityOrProperty; // relationName
        joinAttribute.condition = condition; // joinInverseSideCondition
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

        } else {
            let subQuery = "";
            if (entityOrProperty instanceof Function) {
                const subQueryBuilder: SelectQueryBuilder<any> = (entityOrProperty as any)(((this as any) as SelectQueryBuilder<any>).subQuery());
                this.setParameters(subQueryBuilder.getParameters());
                subQuery = subQueryBuilder.getQuery();

            } else {
                subQuery = entityOrProperty;
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
     * Creates "SELECT FROM" part of SQL query.
     */
    protected createSelectExpression() {

        if (!this.expressionMap.mainAlias)
            throw new Error("Cannot build query because main alias is not set (call qb#from method)");

        // todo throw exception if selects or from is missing

        const allSelects: SelectQuery[] = [];
        const excludedSelects: SelectQuery[] = [];

        if (this.expressionMap.mainAlias.hasMetadata) {
            const metadata = this.expressionMap.mainAlias.metadata;
            allSelects.push(...this.buildEscapedEntityColumnSelects(this.expressionMap.mainAlias.name, metadata));
            excludedSelects.push(...this.findEntityColumnSelects(this.expressionMap.mainAlias.name, metadata));
        }

        // add selects from joins
        this.expressionMap.joinAttributes
            .forEach(join => {
                if (join.metadata) {
                    allSelects.push(...this.buildEscapedEntityColumnSelects(join.alias.name!, join.metadata));
                    excludedSelects.push(...this.findEntityColumnSelects(join.alias.name!, join.metadata));
                } else {
                    const hasMainAlias = this.expressionMap.selects.some(select => select.selection === join.alias.name);
                    if (hasMainAlias) {
                        allSelects.push({selection: this.escape(join.alias.name!) + ".*"});
                        const excludedSelect = this.expressionMap.selects.find(select => select.selection === join.alias.name);
                        excludedSelects.push(excludedSelect!);
                    }
                }
            });

        // add all other selects
        this.expressionMap.selects
            .filter(select => excludedSelects.indexOf(select) === -1)
            .forEach(select => allSelects.push({
                selection: this.replacePropertyNames(select.selection),
                aliasName: select.aliasName
            }));

        // if still selection is empty, then simply set it to all (*)
        if (allSelects.length === 0)
            allSelects.push({selection: "*"});

        let lock = "";
        if (this.connection.driver.type === "SqlServerDriver") {
            switch (this.expressionMap.lockMode) {
                case "pessimistic_read":
                    lock = " WITH (HOLDLOCK, ROWLOCK)";
                    break;
                case "pessimistic_write":
                    lock = " WITH (UPDLOCK, ROWLOCK)";
                    break;
                case "dirty_read":
                    lock = " WITH (NOLOCK)";
                    break;
            }
        }

        // create a selection query
        const froms = this.expressionMap.aliases
            .filter(alias => alias.type === "from" && (alias.tablePath || alias.subQuery))
            .map(alias => {
                if (alias.subQuery)
                    return alias.subQuery + " " + this.escape(alias.name);

                return this.getTableName(alias.tablePath!) + " " + this.escape(alias.name);
            });

        const select = this.createSelectDistinctExpression();
        const selection = allSelects.map(select => select.selection + (select.aliasName ? " AS " + this.escape(select.aliasName) : "")).join(", ");

        return select + selection + " FROM " + froms.join(", ") + lock;
    }

    /**
     * Creates select | select distinct part of SQL query.
     */
    protected createSelectDistinctExpression(): string {
        const {selectDistinct, selectDistinctOn} = this.expressionMap;
        const {driver} = this.connection;

        let select = "SELECT ";
        if (driver.type === "PostgresDriver" && selectDistinctOn.length > 0) {
            const selectDistinctOnMap = selectDistinctOn.map(
                (on) => this.replacePropertyNames(on)
            ).join(", ");

            select = `SELECT DISTINCT ON (${selectDistinctOnMap}) `;
        } else if (selectDistinct) {
            select = "SELECT DISTINCT ";
        }

        return select;
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

        const joins = this.expressionMap.joinAttributes.map(joinAttr => {

            const relation = joinAttr.relation;
            const destinationTableName = joinAttr.tablePath;
            const destinationTableAlias = joinAttr.alias.name;
            const appendedCondition = joinAttr.condition ? " AND (" + joinAttr.condition + ")" : "";
            const parentAlias = joinAttr.parentAlias;

            // if join was build without relation (e.g. without "post.category") then it means that we have direct
            // table to join, without junction table involved. This means we simply join direct table.
            if (!parentAlias || !relation) {
                const destinationJoin = joinAttr.alias.subQuery ? joinAttr.alias.subQuery : this.getTableName(destinationTableName);
                return " " + joinAttr.direction + " JOIN " + destinationJoin + " " + this.escape(destinationTableAlias) +
                    (joinAttr.condition ? " ON " + this.replacePropertyNames(joinAttr.condition) : "");
            }

            // if real entity relation is involved
            if (relation.isManyToOne || relation.isOneToOneOwner) {

                // JOIN `category` `category` ON `category`.`id` = `post`.`categoryId`
                const condition = relation.joinColumns.map(joinColumn => {
                    return destinationTableAlias + "." + joinColumn.referencedColumn!.propertyPath + "=" +
                        parentAlias + "." + relation.propertyPath + "." + joinColumn.referencedColumn!.propertyPath;
                }).join(" AND ");

                return " " + joinAttr.direction + " JOIN " + this.getTableName(destinationTableName) + " " + this.escape(destinationTableAlias) + " ON " + this.replacePropertyNames(condition + appendedCondition);

            } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {

                // JOIN `post` `post` ON `post`.`categoryId` = `category`.`id`
                const condition = relation.inverseRelation!.joinColumns.map(joinColumn => {
                    return destinationTableAlias + "." + relation.inverseRelation!.propertyPath + "." + joinColumn.referencedColumn!.propertyPath + "=" +
                        parentAlias + "." + joinColumn.referencedColumn!.propertyPath;
                }).join(" AND ");

                return " " + joinAttr.direction + " JOIN " + this.getTableName(destinationTableName) + " " + this.escape(destinationTableAlias) + " ON " + this.replacePropertyNames(condition + appendedCondition);

            } else { // means many-to-many
                const junctionTableName = relation.junctionEntityMetadata!.tablePath;

                const junctionAlias = joinAttr.junctionAlias;
                let junctionCondition = "", destinationCondition = "";

                if (relation.isOwning) {

                    junctionCondition = relation.joinColumns.map(joinColumn => {
                        // `post_category`.`postId` = `post`.`id`
                        return junctionAlias + "." + joinColumn.propertyPath + "=" + parentAlias + "." + joinColumn.referencedColumn!.propertyPath;
                    }).join(" AND ");

                    destinationCondition = relation.inverseJoinColumns.map(joinColumn => {
                        // `category`.`id` = `post_category`.`categoryId`
                        return destinationTableAlias + "." + joinColumn.referencedColumn!.propertyPath + "=" + junctionAlias + "." + joinColumn.propertyPath;
                    }).join(" AND ");

                } else {
                    junctionCondition = relation.inverseRelation!.inverseJoinColumns.map(joinColumn => {
                        // `post_category`.`categoryId` = `category`.`id`
                        return junctionAlias + "." + joinColumn.propertyPath + "=" + parentAlias + "." + joinColumn.referencedColumn!.propertyPath;
                    }).join(" AND ");

                    destinationCondition = relation.inverseRelation!.joinColumns.map(joinColumn => {
                        // `post`.`id` = `post_category`.`postId`
                        return destinationTableAlias + "." + joinColumn.referencedColumn!.propertyPath + "=" + junctionAlias + "." + joinColumn.propertyPath;
                    }).join(" AND ");
                }

                return " " + joinAttr.direction + " JOIN " + this.getTableName(junctionTableName) + " " + this.escape(junctionAlias) + " ON " + this.replacePropertyNames(junctionCondition) +
                    " " + joinAttr.direction + " JOIN " + this.getTableName(destinationTableName) + " " + this.escape(destinationTableAlias) + " ON " + this.replacePropertyNames(destinationCondition + appendedCondition);

            }
        });

        return joins.join(" ");
    }

    /**
     * Creates "GROUP BY" part of SQL query.
     */
    protected createGroupByExpression() {
        if (!this.expressionMap.groupBys || !this.expressionMap.groupBys.length) return "";
        return " GROUP BY " + this.replacePropertyNames(this.expressionMap.groupBys.join(", "));
    }

    /**
     * Creates "ORDER BY" part of SQL query.
     */
    protected createOrderByExpression() {
        const orderBys = this.expressionMap.allOrderBys;
        if (Object.keys(orderBys).length > 0)
            return " ORDER BY " + Object.keys(orderBys)
                .map(columnName => {
                    if (typeof orderBys[columnName] === "string") {
                        return this.replacePropertyNames(columnName) + " " + orderBys[columnName];
                    } else {
                        return this.replacePropertyNames(columnName) + " " + (orderBys[columnName] as any).order + " " + (orderBys[columnName] as any).nulls;
                    }
                })
                .join(", ");

        return "";
    }

    /**
     * Creates "LIMIT" and "OFFSET" parts of SQL query.
     */
    protected createLimitOffsetExpression(): string {
        // in the case if nothing is joined in the query builder we don't need to make two requests to get paginated results
        // we can use regular limit / offset, that's why we add offset and limit construction here based on skip and take values
        let offset: number | undefined = this.expressionMap.offset,
            limit: number | undefined = this.expressionMap.limit;
        if (!offset && !limit && this.expressionMap.joinAttributes.length === 0) {
            offset = this.expressionMap.skip;
            limit = this.expressionMap.take;
        }

        if (this.connection.driver.type === "SqlServerDriver") {
            // Due to a limitation in SQL Server's parser implementation it does not support using
            // OFFSET or FETCH NEXT without an ORDER BY clause being provided. In cases where the
            // user does not request one we insert a dummy ORDER BY that does nothing and should
            // have no effect on the query planner or on the order of the results returned.
            // https://dba.stackexchange.com/a/193799
            let prefix = "";
            if ((limit || offset) && Object.keys(this.expressionMap.allOrderBys).length <= 0) {
                prefix = " ORDER BY (SELECT NULL)";
            }

            if (limit && offset)
                return prefix + " OFFSET " + offset + " ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (limit)
                return prefix + " OFFSET 0 ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (offset)
                return prefix + " OFFSET " + offset + " ROWS";

        } else if (this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver" || this.connection.driver.type === "SapDriver") {

            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                throw new OffsetWithoutLimitNotSupportedError();

        } else if (this.connection.driver.type === "AbstractSqliteDriver") {

            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                return " LIMIT -1 OFFSET " + offset;

        } else if (this.connection.driver.type === "OracleDriver") {

            if (limit && offset)
                return " OFFSET " + offset + " ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (limit)
                return " FETCH NEXT " + limit + " ROWS ONLY";
            if (offset)
                return " OFFSET " + offset + " ROWS";

        } else {
            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                return " OFFSET " + offset;
        }

        return "";
    }

    /**
     * Creates "LOCK" part of SQL query.
     */
    protected createLockExpression(): string {
        const driver = this.connection.driver;
        switch (this.expressionMap.lockMode) {
            case "pessimistic_read":
                if (driver.type === "MysqlDriver" || driver.type === "AuroraDataApiDriver") {
                    return " LOCK IN SHARE MODE";

                } else if (driver.type === "PostgresDriver") {
                    return " FOR SHARE";

                } else if (driver.type === "OracleDriver") {
                    return " FOR UPDATE";

                } else if (driver.type === "SqlServerDriver") {
                    return "";

                } else {
                    throw new LockNotSupportedOnGivenDriverError();
                }
            case "pessimistic_write":
                if (driver.type === "MysqlDriver" || driver.type === "AuroraDataApiDriver" || driver.type === "PostgresDriver" || driver.type === "OracleDriver") {
                    return " FOR UPDATE";

                } else if (driver.type === "SqlServerDriver") {
                    return "";

                } else {
                    throw new LockNotSupportedOnGivenDriverError();
                }
            case "pessimistic_partial_write":
                if (driver.type === "PostgresDriver") {
                    return " FOR UPDATE SKIP LOCKED";

                } else {
                    throw new LockNotSupportedOnGivenDriverError();
                }
            case "pessimistic_write_or_fail":
                if (driver.type === "PostgresDriver") {
                    return " FOR UPDATE NOWAIT";
                } else {
                    throw new LockNotSupportedOnGivenDriverError();
                }

            case "for_no_key_update":
                if (driver.type === "PostgresDriver") {
                    return " FOR NO KEY UPDATE";
                } else {
                    throw new LockNotSupportedOnGivenDriverError();
                }
            default:
                return "";
        }
    }

    /**
     * Creates "HAVING" part of SQL query.
     */
    protected createHavingExpression() {
        if (!this.expressionMap.havings || !this.expressionMap.havings.length) return "";
        const conditions = this.expressionMap.havings.map((having, index) => {
            switch (having.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + this.replacePropertyNames(having.condition);
                case "or":
                    return (index > 0 ? "OR " : "") + this.replacePropertyNames(having.condition);
                default:
                    return this.replacePropertyNames(having.condition);
            }
        }).join(" ");

        if (!conditions.length) return "";
        return " HAVING " + conditions;
    }

    protected buildEscapedEntityColumnSelects(aliasName: string, metadata: EntityMetadata): SelectQuery[] {
        const hasMainAlias = this.expressionMap.selects.some(select => select.selection === aliasName);

        const columns: ColumnMetadata[] = [];
        if (hasMainAlias) {
            columns.push(...metadata.columns.filter(column => column.isSelect === true));
        }
        columns.push(...metadata.columns.filter(column => {
            return this.expressionMap.selects.some(select => select.selection === aliasName + "." + column.propertyPath);
        }));

        // if user used partial selection and did not select some primary columns which are required to be selected
        // we select those primary columns and mark them as "virtual". Later virtual column values will be removed from final entity
        // to make entity contain exactly what user selected
        if (columns.length === 0) // however not in the case when nothing (even partial) was selected from this target (for example joins without selection)
            return [];

        const nonSelectedPrimaryColumns = this.expressionMap.queryEntity ? metadata.primaryColumns.filter(primaryColumn => columns.indexOf(primaryColumn) === -1) : [];
        const allColumns = [...columns, ...nonSelectedPrimaryColumns];

        return allColumns.map(column => {
            const selection = this.expressionMap.selects.find(select => select.selection === aliasName + "." + column.propertyPath);
            let selectionPath = this.escape(aliasName) + "." + this.escape(column.databaseName);
            if (this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                if (this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver") {
                    const useLegacy = this.connection.driver.options.legacySpatialSupport;
                    const asText = useLegacy ? "AsText" : "ST_AsText";
                    selectionPath = `${asText}(${selectionPath})`;
                }

                if (this.connection.driver.type === "PostgresDriver")
                    // cast to JSON to trigger parsing in the driver
                    selectionPath = `ST_AsGeoJSON(${selectionPath})::json`;

                if (this.connection.driver.type === "SqlServerDriver")
                    selectionPath = `${selectionPath}.ToString()`;
            }
            return {
                selection: selectionPath,
                aliasName: selection && selection.aliasName ? selection.aliasName : DriverUtils.buildColumnAlias(this.connection.driver, aliasName, column.databaseName),
                // todo: need to keep in mind that custom selection.aliasName breaks hydrator. fix it later!
                virtual: selection ? selection.virtual === true : (hasMainAlias ? false : true),
            };
        });
    }

    protected findEntityColumnSelects(aliasName: string, metadata: EntityMetadata): SelectQuery[] {
        const mainSelect = this.expressionMap.selects.find(select => select.selection === aliasName);
        if (mainSelect)
            return [mainSelect];

        return this.expressionMap.selects.filter(select => {
            return metadata.columns.some(column => select.selection === aliasName + "." + column.propertyPath);
        });
    }

    protected async executeCountQuery(queryRunner: QueryRunner): Promise<number> {

        const mainAlias = this.expressionMap.mainAlias!.name; // todo: will this work with "fromTableName"?
        const metadata = this.expressionMap.mainAlias!.metadata;

        const distinctAlias = this.escape(mainAlias);
        let countSql = "";
        if (metadata.hasMultiplePrimaryKeys) {
            if (this.connection.driver.type === "AbstractSqliteDriver") {
                countSql = `COUNT(DISTINCT(` + metadata.primaryColumns.map((primaryColumn, index) => {
                    const propertyName = this.escape(primaryColumn.databaseName);
                    return `${distinctAlias}.${propertyName}`;
                }).join(" || ") + ")) as \"cnt\"";

            } else {
                countSql = `COUNT(DISTINCT(CONCAT(` + metadata.primaryColumns.map((primaryColumn, index) => {
                    const propertyName = this.escape(primaryColumn.databaseName);
                    return `${distinctAlias}.${propertyName}`;
                }).join(", ") + "))) as \"cnt\"";
            }

        } else {
            countSql = `COUNT(DISTINCT(` + metadata.primaryColumns.map((primaryColumn, index) => {
                const propertyName = this.escape(primaryColumn.databaseName);
                return `${distinctAlias}.${propertyName}`;
            }).join(", ") + ")) as \"cnt\"";
        }

        const results = await this.clone()
            .orderBy()
            .groupBy()
            .offset(undefined)
            .limit(undefined)
            .skip(undefined)
            .take(undefined)
            .select(countSql)
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
                return `${distinctAlias}.${columnAlias} as "ids_${DriverUtils.buildColumnAlias(this.connection.driver, mainAliasName, primaryColumn.databaseName)}"`;
            });

            rawResults = await new this.SelectQueryBuilderCls(this.connection, queryRunner)
                .select(`DISTINCT ${querySelects.join(", ")}`)
                .addSelect(selects)
                .from(`(${this.clone().orderBy().getQuery()})`, "distinctAlias")
                .offset(this.expressionMap.skip)
                .limit(this.expressionMap.take)
                .orderBy(orderBys)
                .cache(this.expressionMap.cache ? this.expressionMap.cache : this.expressionMap.cacheId, this.expressionMap.cacheDuration)
                .setParameters(this.getParameters())
                .setNativeParameters(this.expressionMap.nativeParameters)
                .getRawMany();

            if (rawResults.length > 0) {
                let condition = "";
                const parameters: ObjectLiteral = {};
                if (metadata.hasMultiplePrimaryKeys) {
                    condition = rawResults.map((result, index) => {
                        return metadata.primaryColumns.map(primaryColumn => {
                            const paramKey = `orm_distinct_ids_${index}_${primaryColumn.databaseName}`;
                            parameters[paramKey] = result[`ids_${mainAliasName}_${primaryColumn.databaseName}`];
                            return `${mainAliasName}.${primaryColumn.propertyPath}=:${paramKey}`;
                        }).join(" AND ");
                    }).join(" OR ");
                } else {
                    const ids = rawResults.map(result => result["ids_" + DriverUtils.buildColumnAlias(this.connection.driver, mainAliasName, metadata.primaryColumns[0].databaseName)]);
                    const areAllNumbers = ids.every((id: any) => typeof id === "number");
                    if (areAllNumbers) {
                        // fixes #190. if all numbers then its safe to perform query without parameter
                        condition = `${mainAliasName}.${metadata.primaryColumns[0].propertyPath} IN (${ids.join(", ")})`;
                    } else {
                        parameters["orm_distinct_ids"] = ids;
                        condition = mainAliasName + "." + metadata.primaryColumns[0].propertyPath + " IN (:...orm_distinct_ids)";
                    }
                }
                rawResults = await this.clone()
                    .mergeExpressionMap({extraAppendedAndWhereCondition: condition})
                    .setParameters(parameters)
                    .loadRawResults(queryRunner);
            }

        } else {
            rawResults = await this.loadRawResults(queryRunner);
        }

        if (rawResults.length > 0) {

            // transform raw results into entities
            const rawRelationIdResults = await relationIdLoader.load(rawResults);
            const rawRelationCountResults = await relationCountLoader.load(rawResults);
            const transformer = new RawSqlResultsToEntityTransformer(this.expressionMap, this.connection.driver, rawRelationIdResults, rawRelationCountResults, this.queryRunner);
            entities = transformer.transform(rawResults, this.expressionMap.mainAlias!);

            // broadcast all "after load" events
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, this.expressionMap.mainAlias.metadata, entities);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }
        }

        return {
            raw: rawResults,
            entities: entities,
        };
    }

    protected createOrderByCombinedWithSelectExpression(parentAlias: string): [string, OrderByCondition] {

        // if table has a default order then apply it
        const orderBys = this.expressionMap.allOrderBys;
        const selectString = Object.keys(orderBys)
            .map(orderCriteria => {
                if (orderCriteria.indexOf(".") !== -1) {
                    const [aliasName, propertyPath] = orderCriteria.split(".");
                    const alias = this.expressionMap.findAliasByName(aliasName);
                    const column = alias.metadata.findColumnWithPropertyName(propertyPath);
                    return this.escape(parentAlias) + "." + this.escape(DriverUtils.buildColumnAlias(this.connection.driver, aliasName, column!.databaseName));
                } else {
                    if (this.expressionMap.selects.find(select => select.selection === orderCriteria || select.aliasName === orderCriteria))
                        return this.escape(parentAlias) + "." + orderCriteria;

                    return "";
                }
            })
            .join(", ");

        const orderByObject: OrderByCondition = {};
        Object.keys(orderBys).forEach(orderCriteria => {
            if (orderCriteria.indexOf(".") !== -1) {
                const [aliasName, propertyPath] = orderCriteria.split(".");
                const alias = this.expressionMap.findAliasByName(aliasName);
                const column = alias.metadata.findColumnWithPropertyName(propertyPath);
                orderByObject[this.escape(parentAlias) + "." + this.escape(DriverUtils.buildColumnAlias(this.connection.driver, aliasName, column!.databaseName))] = orderBys[orderCriteria];
            } else {
                if (this.expressionMap.selects.find(select => select.selection === orderCriteria || select.aliasName === orderCriteria)) {
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
        let savedQueryResultCacheOptions: QueryResultCacheOptions | undefined;
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
        ObjectUtils.assign(this.expressionMap, expressionMap);
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

}

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class InsertQueryBuilder<Entity> extends QueryBuilder<Entity> {

    SelectQueryBuilderCls = SelectQueryBuilder;

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        const sql = this.createInsertExpression();
        return sql.trim();
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<InsertResult> {
        // console.time("QueryBuilder.execute");
        // console.time(".database stuff");
        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;

        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            // console.timeEnd(".database stuff");
            // console.time(".value sets");
            const valueSets: ObjectLiteral[] = this.getValueSets();
            // console.timeEnd(".value sets");

            // call before insertion methods in listeners and subscribers
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias!.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                valueSets.forEach(valueSet => {
                    queryRunner.broadcaster.broadcastBeforeInsertEvent(broadcastResult, this.expressionMap.mainAlias!.metadata, valueSet);
                });
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            let declareSql: string | null = null;
            let selectOutputSql: string | null = null;

            // if update entity mode is enabled we may need extra columns for the returning statement
            // console.time(".prepare returning statement");
            const returningResultsEntityUpdator = new ReturningResultsEntityUpdator(queryRunner, this.expressionMap);
            if (this.expressionMap.updateEntity === true && this.expressionMap.mainAlias!.hasMetadata) {
                this.expressionMap.extraReturningColumns = returningResultsEntityUpdator.getInsertionReturningColumns();

                if (this.expressionMap.extraReturningColumns.length > 0 && this.connection.driver.type === "SqlServerDriver") {
                    declareSql = this.connection.driver.buildTableVariableDeclaration("@OutputTable", this.expressionMap.extraReturningColumns);
                    selectOutputSql = `SELECT * FROM @OutputTable`;
                }
            }
            // console.timeEnd(".prepare returning statement");

            // execute query
            // console.time(".getting query and parameters");
            const [insertSql, parameters] = this.getQueryAndParameters();
            // console.timeEnd(".getting query and parameters");
            const insertResult = new InsertResult();
            // console.time(".query execution by database");
            const statements = [declareSql, insertSql, selectOutputSql];
            insertResult.raw = await queryRunner.query(
                statements.filter(sql => sql != null).join(";\n\n"),
                parameters,
            );
            // console.timeEnd(".query execution by database");

            // load returning results and set them to the entity if entity updation is enabled
            if (this.expressionMap.updateEntity === true && this.expressionMap.mainAlias!.hasMetadata) {
                // console.time(".updating entity");
                await returningResultsEntityUpdator.insert(insertResult, valueSets);
                // console.timeEnd(".updating entity");
            }

            // call after insertion methods in listeners and subscribers
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias!.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                valueSets.forEach(valueSet => {
                    queryRunner.broadcaster.broadcastAfterInsertEvent(broadcastResult, this.expressionMap.mainAlias!.metadata, valueSet);
                });
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            // close transaction if we started it
            // console.time(".commit");
            if (transactionStartedByUs) {
                await queryRunner.commitTransaction();
            }
            // console.timeEnd(".commit");

            return insertResult;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {

            // console.time(".releasing connection");
            if (queryRunner !== this.queryRunner) { // means we created our own query runner
                await queryRunner.release();
            }
            if (this.connection.driver.autoSave && !queryRunner.isTransactionActive) {
                await this.connection.driver.autoSave();
            }
            // console.timeEnd(".releasing connection");
            // console.timeEnd("QueryBuilder.execute");
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies INTO which entity's table insertion will be executed.
     */
    into<T>(entityTarget: ObjectType<T> | EntitySchema<T> | string, columns?: string[]): InsertQueryBuilder<T> {
        entityTarget = entityTarget instanceof EntitySchema ? entityTarget.options.name : entityTarget;
        const mainAlias = this.createFromAlias(entityTarget);
        this.expressionMap.setMainAlias(mainAlias);
        this.expressionMap.insertColumns = columns || [];
        return (this as any) as InsertQueryBuilder<T>;
    }

    /**
     * Values needs to be inserted into table.
     */
    values(values: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[]): this {
        this.expressionMap.valuesSet = values;
        return this;
    }

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
    output(output: string | string[]): this;

    /**
     * Optional returning/output clause.
     */
    output(output: string | string[]): this {
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
    returning(returning: string | string[]): this;

    /**
     * Optional returning/output clause.
     */
    returning(returning: string | string[]): this {

        // not all databases support returning/output cause
        if (!this.connection.driver.isReturningSqlSupported())
            throw new ReturningStatementNotSupportedError();

        this.expressionMap.returning = returning;
        return this;
    }

    /**
     * Indicates if entity must be updated after insertion operations.
     * This may produce extra query or use RETURNING / OUTPUT statement (depend on database).
     * Enabled by default.
     */
    updateEntity(enabled: boolean): this {
        this.expressionMap.updateEntity = enabled;
        return this;
    }

    /**
     * Adds additional ON CONFLICT statement supported in postgres and cockroach.
     */
    onConflict(statement: string): this {
        this.expressionMap.onConflict = statement;
        return this;
    }

    /**
     * Adds additional ignore statement supported in databases.
     */
    orIgnore(statement: string | boolean = true): this {
        this.expressionMap.onIgnore = statement;
        return this;
    }

    /**
     * Adds additional update statement supported in databases.
     */
    orUpdate(statement?: { columns?: string[], overwrite?: string[], conflict_target?: string | string[] }): this {
        this.expressionMap.onUpdate = {};
        if (statement && Array.isArray(statement.conflict_target))
            this.expressionMap.onUpdate.conflict = ` ( ${statement.conflict_target.join(", ")} ) `;
        if (statement && typeof statement.conflict_target === "string")
            this.expressionMap.onUpdate.conflict = ` ON CONSTRAINT ${statement.conflict_target} `;
        if (statement && Array.isArray(statement.columns))
            this.expressionMap.onUpdate.columns = statement.columns.map(column => `${column} = :${column}`).join(", ");
        if (statement && Array.isArray(statement.overwrite)) {
            if (this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver") {
                this.expressionMap.onUpdate.overwrite = statement.overwrite.map(column => `${column} = VALUES(${column})`).join(", ");
            } else if (this.connection.driver.type === "PostgresDriver" || this.connection.driver.type === "AbstractSqliteDriver" || this.connection.driver.type === "CockroachDriver") {
                this.expressionMap.onUpdate.overwrite = statement.overwrite.map(column => `${column} = EXCLUDED.${column}`).join(", ");
            }
        }
        return this;
    }


    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates INSERT express used to perform insert query.
     */
    protected createInsertExpression() {
        const tableName = this.getTableName(this.getMainTableName());
        const valuesExpression = this.createValuesExpression(); // its important to get values before returning expression because oracle rely on native parameters and ordering of them is important
        const returningExpression = this.createReturningExpression();
        const columnsExpression = this.createColumnNamesExpression();
        let query = "INSERT ";

        if (this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver") {
            query += `${this.expressionMap.onIgnore ? " IGNORE " : ""}`;
        }

        query += `INTO ${tableName}`;

        // add columns expression
        if (columnsExpression) {
            query += `(${columnsExpression})`;
        } else {
            if (!valuesExpression && (this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver")) // special syntax for mysql DEFAULT VALUES insertion
                query += "()";
        }

        // add OUTPUT expression
        if (returningExpression && this.connection.driver.type === "SqlServerDriver") {
            query += ` OUTPUT ${returningExpression}`;
        }

        // add VALUES expression
        if (valuesExpression) {
            query += ` VALUES ${valuesExpression}`;
        } else {
            if (this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver") { // special syntax for mysql DEFAULT VALUES insertion
                query += " VALUES ()";
            } else {
                query += ` DEFAULT VALUES`;
            }
        }
        if (this.connection.driver.type === "PostgresDriver" || this.connection.driver.type === "AbstractSqliteDriver" || this.connection.driver.type === "CockroachDriver") {
            query += `${this.expressionMap.onIgnore ? " ON CONFLICT DO NOTHING " : ""}`;
            query += `${this.expressionMap.onConflict ? " ON CONFLICT " + this.expressionMap.onConflict : ""}`;
            if (this.expressionMap.onUpdate) {
                const {overwrite, columns, conflict} = this.expressionMap.onUpdate;
                query += `${columns ? " ON CONFLICT " + conflict + " DO UPDATE SET " + columns : ""}`;
                query += `${overwrite ? " ON CONFLICT " + conflict + " DO UPDATE SET " + overwrite : ""}`;
            }
        } else if (this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver") {
            if (this.expressionMap.onUpdate) {
                const {overwrite, columns} = this.expressionMap.onUpdate;
                query += `${columns ? " ON DUPLICATE KEY UPDATE " + columns : ""}`;
                query += `${overwrite ? " ON DUPLICATE KEY UPDATE " + overwrite : ""}`;
            }
        }

        // add RETURNING expression
        if (returningExpression && (this.connection.driver.type === "PostgresDriver" || this.connection.driver.type === "OracleDriver" || this.connection.driver.type === "CockroachDriver")) {
            query += ` RETURNING ${returningExpression}`;
        }

        return query;
    }

    /**
     * Gets list of columns where values must be inserted to.
     */
    protected getInsertedColumns(): ColumnMetadata[] {
        if (!this.expressionMap.mainAlias!.hasMetadata)
            return [];

        return this.expressionMap.mainAlias!.metadata.columns.filter(column => {

            // if user specified list of columns he wants to insert to, then we filter only them
            if (this.expressionMap.insertColumns.length)
                return this.expressionMap.insertColumns.indexOf(column.propertyPath) !== -1;

            // skip columns the user doesn't want included by default
            if (!column.isInsert) { return false; }

            // if user did not specified such list then return all columns except auto-increment one
            // for Oracle we return auto-increment column as well because Oracle does not support DEFAULT VALUES expression
            if (column.isGenerated && column.generationStrategy === "increment"
                && !(this.connection.driver.type === "OracleDriver")
                && !(this.connection.driver.type === "AbstractSqliteDriver")
                && !(this.connection.driver.type === "MysqlDriver")
                && !(this.connection.driver.type === "AuroraDataApiDriver"))
                return false;

            return true;
        });
    }

    /**
     * Creates a columns string where values must be inserted to for INSERT INTO expression.
     */
    protected createColumnNamesExpression(): string {
        const columns = this.getInsertedColumns();
        if (columns.length > 0)
            return columns.map(column => this.escape(column.databaseName)).join(", ");

        // in the case if there are no insert columns specified and table without metadata used
        // we get columns from the inserted value map, in the case if only one inserted map is specified
        if (!this.expressionMap.mainAlias!.hasMetadata && !this.expressionMap.insertColumns.length) {
            const valueSets = this.getValueSets();
            if (valueSets.length === 1)
                return Object.keys(valueSets[0]).map(columnName => this.escape(columnName)).join(", ");
        }

        // get a table name and all column database names
        return this.expressionMap.insertColumns.map(columnName => this.escape(columnName)).join(", ");
    }

    /**
     * Creates list of values needs to be inserted in the VALUES expression.
     */
    protected createValuesExpression(): string {
        const valueSets = this.getValueSets();
        const columns = this.getInsertedColumns();

        // if column metadatas are given then apply all necessary operations with values
        if (columns.length > 0) {
            let expression = "";
            let parametersCount = Object.keys(this.expressionMap.nativeParameters).length;
            valueSets.forEach((valueSet, valueSetIndex) => {
                columns.forEach((column, columnIndex) => {
                    if (columnIndex === 0) {
                        expression += "(";
                    }
                    const paramName = "i" + valueSetIndex + "_" + column.databaseName;

                    // extract real value from the entity
                    let value = column.getEntityValue(valueSet);

                    // if column is relational and value is an object then get real referenced column value from this object
                    // for example column value is { question: { id: 1 } }, value will be equal to { id: 1 }
                    // and we extract "1" from this object
                    /*if (column.referencedColumn && value instanceof Object && !(value instanceof Function)) { // todo: check if we still need it since getEntityValue already has similar code
              value = column.referencedColumn.getEntityValue(value);
          }*/


                    if (!(value instanceof Function)) {
                        // make sure our value is normalized by a driver
                        value = this.connection.driver.preparePersistentValue(value, column);
                    }

                    // newly inserted entities always have a version equal to 1 (first version)
                    // also, user-specified version must be empty
                    if (column.isVersion && value === undefined) {
                        expression += "1";

                        // } else if (column.isNestedSetLeft) {
                        //     const tableName = this.connection.driver.escape(column.entityMetadata.tablePath);
                        //     const rightColumnName = this.connection.driver.escape(column.entityMetadata.nestedSetRightColumn!.databaseName);
                        //     const subQuery = `(SELECT c.max + 1 FROM (SELECT MAX(${rightColumnName}) as max from ${tableName}) c)`;
                        //     expression += subQuery;
                        //
                        // } else if (column.isNestedSetRight) {
                        //     const tableName = this.connection.driver.escape(column.entityMetadata.tablePath);
                        //     const rightColumnName = this.connection.driver.escape(column.entityMetadata.nestedSetRightColumn!.databaseName);
                        //     const subQuery = `(SELECT c.max + 2 FROM (SELECT MAX(${rightColumnName}) as max from ${tableName}) c)`;
                        //     expression += subQuery;

                    } else if (column.isDiscriminator) {
                        this.expressionMap.nativeParameters["discriminator_value_" + parametersCount] = this.expressionMap.mainAlias!.metadata.discriminatorValue;
                        expression += this.connection.driver.createParameter("discriminator_value_" + parametersCount, parametersCount);
                        parametersCount++;
                        // return "1";

                        // for create and update dates we insert current date
                        // no, we don't do it because this constant is already in "default" value of the column
                        // with extended timestamp functionality, like CURRENT_TIMESTAMP(6) for example
                        // } else if (column.isCreateDate || column.isUpdateDate) {
                        //     return "CURRENT_TIMESTAMP";

                        // if column is generated uuid and database does not support its generation and custom generated value was not provided by a user - we generate a new uuid value for insertion
                    } else if (column.isGenerated && column.generationStrategy === "uuid" && !this.connection.driver.isUUIDGenerationSupported() && value === undefined) {

                        const paramName = "uuid_" + column.databaseName + valueSetIndex;
                        value = RandomGenerator.uuid4();
                        this.expressionMap.nativeParameters[paramName] = value;
                        expression += this.connection.driver.createParameter(paramName, parametersCount);
                        parametersCount++;

                        // if value for this column was not provided then insert default value
                    } else if (value === undefined) {
                        if (this.connection.driver.type === "AbstractSqliteDriver" || this.connection.driver.type === "SapDriver") { // unfortunately sqlite does not support DEFAULT expression in INSERT queries
                            if (column.default !== undefined) { // try to use default defined in the column
                                expression += this.connection.driver.normalizeDefault(column);
                            } else {
                                expression += "NULL"; // otherwise simply use NULL and pray if column is nullable
                            }

                        } else {
                            expression += "DEFAULT";
                        }

                        // support for SQL expressions in queries
                    } else if (value instanceof Function) {
                        expression += value();

                        // just any other regular value
                    } else {
                        if (this.connection.driver.type === "SqlServerDriver")
                            value = this.connection.driver.parametrizeValue(column, value);

                        // we need to store array values in a special class to make sure parameter replacement will work correctly
                        // if (value instanceof Array)
                        //     value = new ArrayParameter(value);

                        this.expressionMap.nativeParameters[paramName] = value;
                        if ((this.connection.driver.type === "MysqlDriver" || this.connection.driver.type === "AuroraDataApiDriver") && this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                            const useLegacy = this.connection.driver.options.legacySpatialSupport;
                            const geomFromText = useLegacy ? "GeomFromText" : "ST_GeomFromText";
                            if (column.srid != null) {
                                expression += `${geomFromText}(${this.connection.driver.createParameter(paramName, parametersCount)}, ${column.srid})`;
                            } else {
                                expression += `${geomFromText}(${this.connection.driver.createParameter(paramName, parametersCount)})`;
                            }
                        } else if (this.connection.driver.type === "PostgresDriver" && this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                            if (column.srid != null) {
                                expression += `ST_SetSRID(ST_GeomFromGeoJSON(${this.connection.driver.createParameter(paramName, parametersCount)}), ${column.srid})::${column.type}`;
                            } else {
                                expression += `ST_GeomFromGeoJSON(${this.connection.driver.createParameter(paramName, parametersCount)})::${column.type}`;
                            }
                        } else if (this.connection.driver.type === "SqlServerDriver" && this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                            expression += column.type + "::STGeomFromText(" + this.connection.driver.createParameter(paramName, parametersCount) + ", " + (column.srid || "0") + ")";
                        } else {
                            expression += this.connection.driver.createParameter(paramName, parametersCount);
                        }
                        parametersCount++;
                    }

                    if (columnIndex === columns.length - 1) {
                        if (valueSetIndex === valueSets.length - 1) {
                            expression += ")";
                        } else {
                            expression += "), ";
                        }
                    } else {
                        expression += ", ";
                    }
                });
            });
            if (expression === "()")
                return "";

            return expression;
        } else { // for tables without metadata
            // get values needs to be inserted
            let expression = "";
            let parametersCount = Object.keys(this.expressionMap.nativeParameters).length;

            valueSets.forEach((valueSet, insertionIndex) => {
                const columns = Object.keys(valueSet);
                columns.forEach((columnName, columnIndex) => {
                    if (columnIndex === 0) {
                        expression += "(";
                    }
                    const paramName = "i" + insertionIndex + "_" + columnName;
                    const value = valueSet[columnName];

                    // support for SQL expressions in queries
                    if (value instanceof Function) {
                        expression += value();

                        // if value for this column was not provided then insert default value
                    } else if (value === undefined) {
                        if (this.connection.driver.type === "AbstractSqliteDriver" || this.connection.driver.type === "SapDriver") {
                            expression += "NULL";

                        } else {
                            expression += "DEFAULT";
                        }

                        // just any other regular value
                    } else {
                        this.expressionMap.nativeParameters[paramName] = value;
                        expression += this.connection.driver.createParameter(paramName, parametersCount);
                        parametersCount++;
                    }

                    if (columnIndex === Object.keys(valueSet).length - 1) {
                        if (insertionIndex === valueSets.length - 1) {
                            expression += ")";
                        } else {
                            expression += "), ";
                        }
                    } else {
                        expression += ", ";
                    }
                });
            });
            if (expression === "()")
                return "";
            return expression;
        }
    }

    /**
     * Gets array of values need to be inserted into the target table.
     */
    protected getValueSets(): ObjectLiteral[] {
        if (Array.isArray(this.expressionMap.valuesSet) && this.expressionMap.valuesSet.length > 0)
            return this.expressionMap.valuesSet;

        if (this.expressionMap.valuesSet instanceof Object)
            return [this.expressionMap.valuesSet];

        throw new InsertValuesMissingError();
    }

}

/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export class SoftDeleteQueryBuilder<Entity> extends QueryBuilder<Entity> implements WhereExpression {

    SelectQueryBuilderCls = SelectQueryBuilder;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOrQueryBuilder: Connection | QueryBuilder<any>, queryRunner?: QueryRunner) {
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
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        return sql.trim();
    }

    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    async execute(): Promise<UpdateResult> {
        const queryRunner = this.obtainQueryRunner();
        let transactionStartedByUs = false;

        try {

            // start transaction if it was enabled
            if (this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false) {
                await queryRunner.startTransaction();
                transactionStartedByUs = true;
            }

            // call before updation methods in listeners and subscribers
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias!.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                queryRunner.broadcaster.broadcastBeforeUpdateEvent(broadcastResult, this.expressionMap.mainAlias!.metadata);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            // if update entity mode is enabled we may need extra columns for the returning statement
            const returningResultsEntityUpdator = new ReturningResultsEntityUpdator(queryRunner, this.expressionMap);
            if (this.expressionMap.updateEntity === true &&
                this.expressionMap.mainAlias!.hasMetadata &&
                this.expressionMap.whereEntities.length > 0) {
                this.expressionMap.extraReturningColumns = returningResultsEntityUpdator.getUpdationReturningColumns();
            }

            // execute update query
            const [sql, parameters] = this.getQueryAndParameters();
            const updateResult = new UpdateResult();
            const result = await queryRunner.query(sql, parameters);

            const driver = queryRunner.connection.driver;
            if (driver.type === "PostgresDriver") {
                updateResult.raw = result[0];
                updateResult.affected = result[1];
            } else {
                updateResult.raw = result;
            }

            // if we are updating entities and entity updation is enabled we must update some of entity columns (like version, update date, etc.)
            if (this.expressionMap.updateEntity === true &&
                this.expressionMap.mainAlias!.hasMetadata &&
                this.expressionMap.whereEntities.length > 0) {
                await returningResultsEntityUpdator.update(updateResult, this.expressionMap.whereEntities);
            }

            // call after updation methods in listeners and subscribers
            if (this.expressionMap.callListeners === true && this.expressionMap.mainAlias!.hasMetadata) {
                const broadcastResult = new BroadcasterResult();
                queryRunner.broadcaster.broadcastAfterUpdateEvent(broadcastResult, this.expressionMap.mainAlias!.metadata);
                if (broadcastResult.promises.length > 0) await Promise.all(broadcastResult.promises);
            }

            // close transaction if we started it
            if (transactionStartedByUs)
                await queryRunner.commitTransaction();

            return updateResult;

        } catch (error) {

            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }
            throw error;

        } finally {
            if (queryRunner !== this.queryRunner) { // means we created our own query runner
                await queryRunner.release();
            }
            if (this.connection.driver.autoSave && !queryRunner.isTransactionActive) {
                await this.connection.driver.autoSave();
            }
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Specifies FROM which entity's table select/update/delete/soft-delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    from<T>(entityTarget: ObjectType<T> | EntitySchema<T> | string, aliasName?: string): SoftDeleteQueryBuilder<T> {
        entityTarget = entityTarget instanceof EntitySchema ? entityTarget.options.name : entityTarget;
        const mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return (this as any) as SoftDeleteQueryBuilder<T>;
    }

    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    where(where: string | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[], parameters?: ObjectLiteral): this {
        this.expressionMap.wheres = []; // don't move this block below since computeWhereParameter can add where expressions
        const condition = this.computeWhereParameter(where);
        if (condition)
            this.expressionMap.wheres = [{type: "simple", condition: condition}];
        if (parameters)
            this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    andWhere(where: string | ((qb: this) => string) | Brackets, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({type: "and", condition: this.computeWhereParameter(where)});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    orWhere(where: string | ((qb: this) => string) | Brackets, parameters?: ObjectLiteral): this {
        this.expressionMap.wheres.push({type: "or", condition: this.computeWhereParameter(where)});
        if (parameters) this.setParameters(parameters);
        return this;
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    whereInIds(ids: any | any[]): this {
        return this.where(this.createWhereIdsExpression(ids));
    }

    /**
     * Adds new AND WHERE with conditions for the given ids.
     */
    andWhereInIds(ids: any | any[]): this {
        return this.andWhere(this.createWhereIdsExpression(ids));
    }

    /**
     * Adds new OR WHERE with conditions for the given ids.
     */
    orWhereInIds(ids: any | any[]): this {
        return this.orWhere(this.createWhereIdsExpression(ids));
    }

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
    output(output: string | string[]): this;

    /**
     * Optional returning/output clause.
     */
    output(output: string | string[]): this {
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
    returning(returning: string | string[]): this;

    /**
     * Optional returning/output clause.
     */
    returning(returning: string | string[]): this {

        // not all databases support returning/output cause
        if (!this.connection.driver.isReturningSqlSupported())
            throw new ReturningStatementNotSupportedError();

        this.expressionMap.returning = returning;
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
    orderBy(sort: string, order?: "ASC" | "DESC", nulls?: "NULLS FIRST" | "NULLS LAST"): this;

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
    orderBy(sort?: string | OrderByCondition, order: "ASC" | "DESC" = "ASC", nulls?: "NULLS FIRST" | "NULLS LAST"): this {
        if (sort) {
            if (sort instanceof Object) {
                this.expressionMap.orderBys = sort as OrderByCondition;
            } else {
                if (nulls) {
                    this.expressionMap.orderBys = {[sort as string]: {order, nulls}};
                } else {
                    this.expressionMap.orderBys = {[sort as string]: order};
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
    addOrderBy(sort: string, order: "ASC" | "DESC" = "ASC", nulls?: "NULLS FIRST" | "NULLS LAST"): this {
        if (nulls) {
            this.expressionMap.orderBys[sort] = {order, nulls};
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
    whereEntity(entity: Entity | Entity[]): this {
        if (!this.expressionMap.mainAlias!.hasMetadata)
            throw new Error(`.whereEntity method can only be used on queries which update real entity table.`);

        this.expressionMap.wheres = [];
        const entities: Entity[] = Array.isArray(entity) ? entity : [entity];
        entities.forEach(entity => {

            const entityIdMap = this.expressionMap.mainAlias!.metadata.getEntityIdMap(entity);
            if (!entityIdMap)
                throw new Error(`Provided entity does not have ids set, cannot perform operation.`);

            this.orWhereInIds(entityIdMap);
        });

        this.expressionMap.whereEntities = entities;
        return this;
    }

    /**
     * Indicates if entity must be updated after update operation.
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
     * Creates UPDATE express used to perform insert query.
     */
    protected createUpdateExpression() {
        const metadata = this.expressionMap.mainAlias!.hasMetadata ? this.expressionMap.mainAlias!.metadata : undefined;
        if (!metadata)
            throw new Error(`Cannot get entity metadata for the given alias "${this.expressionMap.mainAlias}"`);
        if (!metadata.deleteDateColumn) {
            throw new MissingDeleteDateColumnError(metadata);
        }

        // prepare columns and values to be updated
        const updateColumnAndValues: string[] = [];
        const newParameters: ObjectLiteral = {};

        switch (this.expressionMap.queryType) {
            case "soft-delete":
                updateColumnAndValues.push(this.escape(metadata.deleteDateColumn.databaseName) + " = CURRENT_TIMESTAMP");
                break;
            case "restore":
                updateColumnAndValues.push(this.escape(metadata.deleteDateColumn.databaseName) + " = NULL");
                break;
            default:
                throw new Error(`The queryType must be "soft-delete" or "restore"`);
        }
        if (metadata.versionColumn)
            updateColumnAndValues.push(this.escape(metadata.versionColumn.databaseName) + " = " + this.escape(metadata.versionColumn.databaseName) + " + 1");
        if (metadata.updateDateColumn)
            updateColumnAndValues.push(this.escape(metadata.updateDateColumn.databaseName) + " = CURRENT_TIMESTAMP"); // todo: fix issue with CURRENT_TIMESTAMP(6) being used, can "DEFAULT" be used?!

        if (updateColumnAndValues.length <= 0) {
            throw new UpdateValuesMissingError();
        }

        // we re-write parameters this way because we want our "UPDATE ... SET" parameters to be first in the list of "nativeParameters"
        // because some drivers like mysql depend on order of parameters
        if (this.connection.driver.type === "MysqlDriver" ||
            this.connection.driver.type === "OracleDriver" ||
            this.connection.driver.type === "AbstractSqliteDriver") {
            this.expressionMap.nativeParameters = Object.assign(newParameters, this.expressionMap.nativeParameters);
        }

        // get a table name and all column database names
        const whereExpression = this.createWhereExpression();
        const returningExpression = this.createReturningExpression();

        // generate and return sql update query
        if (returningExpression && (this.connection.driver.type === "PostgresDriver" || this.connection.driver.type === "OracleDriver" || this.connection.driver.type === "CockroachDriver")) {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")}${whereExpression} RETURNING ${returningExpression}`;

        } else if (returningExpression && this.connection.driver.type === "SqlServerDriver") {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")} OUTPUT ${returningExpression}${whereExpression}`;

        } else {
            return `UPDATE ${this.getTableName(this.getMainTableName())} SET ${updateColumnAndValues.join(", ")}${whereExpression}`; // todo: how do we replace aliases in where to nothing?
        }
    }

    /**
     * Creates "ORDER BY" part of SQL query.
     */
    protected createOrderByExpression() {
        const orderBys = this.expressionMap.orderBys;
        if (Object.keys(orderBys).length > 0)
            return " ORDER BY " + Object.keys(orderBys)
                .map(columnName => {
                    if (typeof orderBys[columnName] === "string") {
                        return this.replacePropertyNames(columnName) + " " + orderBys[columnName];
                    } else {
                        return this.replacePropertyNames(columnName) + " " + (orderBys[columnName] as any).order + " " + (orderBys[columnName] as any).nulls;
                    }
                })
                .join(", ");

        return "";
    }

    /**
     * Creates "LIMIT" parts of SQL query.
     */
    protected createLimitExpression(): string {
        const limit: number | undefined = this.expressionMap.limit;

        if (limit) {
            if (this.connection.driver.type === "MysqlDriver") {
                return " LIMIT " + limit;
            } else {
                throw new LimitOnUpdateNotSupportedError();
            }
        }

        return "";
    }

}

