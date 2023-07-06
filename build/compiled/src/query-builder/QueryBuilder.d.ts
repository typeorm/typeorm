import { ObjectLiteral } from "../common/ObjectLiteral";
import { QueryRunner } from "../query-runner/QueryRunner";
import { Connection } from "../connection/Connection";
import { QueryExpressionMap } from "./QueryExpressionMap";
import { SelectQueryBuilder } from "./SelectQueryBuilder";
import { UpdateQueryBuilder } from "./UpdateQueryBuilder";
import { DeleteQueryBuilder } from "./DeleteQueryBuilder";
import { SoftDeleteQueryBuilder } from "./SoftDeleteQueryBuilder";
import { InsertQueryBuilder } from "./InsertQueryBuilder";
import { RelationQueryBuilder } from "./RelationQueryBuilder";
import { EntityTarget } from "../common/EntityTarget";
import { Alias } from "./Alias";
import { Brackets } from "./Brackets";
import { QueryDeepPartialEntity } from "./QueryPartialEntity";
import { ColumnMetadata } from "../metadata/ColumnMetadata";
import { FindOperator } from "../find-options/FindOperator";
/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
export declare abstract class QueryBuilder<Entity extends ObjectLiteral> {
    /**
     * Connection on which QueryBuilder was created.
     */
    readonly connection: Connection;
    /**
     * Contains all properties of the QueryBuilder that needs to be build a final query.
     */
    readonly expressionMap: QueryExpressionMap;
    /**
     * Query runner used to execute query builder query.
     */
    protected queryRunner?: QueryRunner;
    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(queryBuilder: QueryBuilder<any>);
    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    constructor(connection: Connection, queryRunner?: QueryRunner);
    /**
     * Gets generated sql query without parameters being replaced.
     */
    abstract getQuery(): string;
    /**
     * Gets the main alias string used in this query builder.
     */
    get alias(): string;
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
     * Creates INSERT query.
     */
    insert(): InsertQueryBuilder<Entity>;
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
    update<Entity extends ObjectLiteral>(entity: EntityTarget<Entity>, updateSet?: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;
    /**
     * Creates UPDATE query for the given table name and applies given update values.
     */
    update(tableName: string, updateSet?: QueryDeepPartialEntity<Entity>): UpdateQueryBuilder<Entity>;
    /**
     * Creates DELETE query.
     */
    delete(): DeleteQueryBuilder<Entity>;
    softDelete(): SoftDeleteQueryBuilder<any>;
    restore(): SoftDeleteQueryBuilder<any>;
    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation(propertyPath: string): RelationQueryBuilder<Entity>;
    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    relation<T extends ObjectLiteral>(entityTarget: EntityTarget<T>, propertyPath: string): RelationQueryBuilder<T>;
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
     * Sets parameter name and its value.
     */
    setParameter(key: string, value: any): this;
    /**
     * Adds all parameters from the given object.
     */
    setParameters(parameters: ObjectLiteral): this;
    /**
     * Adds native parameters from the given object.
     */
    setNativeParameters(parameters: ObjectLiteral): this;
    /**
     * Gets all parameters.
     */
    getParameters(): ObjectLiteral;
    /**
     * Prints sql to stdout using console.log.
     */
    printSql(): this;
    /**
     * Gets generated sql that will be executed.
     * Parameters in the query are escaped for the currently used driver.
     */
    getSql(): string;
    /**
     * Gets query to be executed with all parameters used in it.
     */
    getQueryAndParameters(): [string, any[]];
    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    execute(): Promise<any>;
    /**
     * Creates a completely new query builder.
     * Uses same query runner as current QueryBuilder.
     */
    createQueryBuilder(): this;
    /**
     * Clones query builder as it is.
     * Note: it uses new query runner, if you want query builder that uses exactly same query runner,
     * you can create query builder using its constructor, for example new SelectQueryBuilder(queryBuilder)
     * where queryBuilder is cloned QueryBuilder.
     */
    clone(): this;
    /**
     * Includes a Query comment in the query builder.  This is helpful for debugging purposes,
     * such as finding a specific query in the database server's logs, or for categorization using
     * an APM product.
     */
    comment(comment: string): this;
    /**
     * Disables escaping.
     */
    disableEscaping(): this;
    /**
     * Escapes table name, column name or alias name using current database's escaping character.
     */
    escape(name: string): string;
    /**
     * Sets or overrides query builder's QueryRunner.
     */
    setQueryRunner(queryRunner: QueryRunner): this;
    /**
     * Indicates if listeners and subscribers must be called before and after query execution.
     * Enabled by default.
     */
    callListeners(enabled: boolean): this;
    /**
     * If set to true the query will be wrapped into a transaction.
     */
    useTransaction(enabled: boolean): this;
    /**
     * Gets escaped table name with schema name if SqlServer driver used with custom
     * schema name, otherwise returns escaped table name.
     */
    protected getTableName(tablePath: string): string;
    /**
     * Gets name of the table where insert should be performed.
     */
    protected getMainTableName(): string;
    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    protected createFromAlias(entityTarget: EntityTarget<any> | ((qb: SelectQueryBuilder<any>) => SelectQueryBuilder<any>), aliasName?: string): Alias;
    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    protected replacePropertyNames(statement: string): string;
    protected createComment(): string;
    /**
     * Creates "WHERE" expression.
     */
    protected createWhereExpression(): string;
    /**
     * Creates "RETURNING" / "OUTPUT" expression.
     */
    protected createReturningExpression(): string;
    /**
     * If returning / output cause is set to array of column names,
     * then this method will return all column metadatas of those column names.
     */
    protected getReturningColumns(): ColumnMetadata[];
    /**
     * Concatenates all added where expressions into one string.
     */
    protected createWhereExpressionString(): string;
    /**
     * Creates "WHERE" expression and variables for the given "ids".
     */
    protected createWhereIdsExpression(ids: any | any[]): string;
    /**
     * Computes given where argument - transforms to a where string all forms it can take.
     */
    protected computeWhereParameter(where: string | ((qb: this) => string) | Brackets | ObjectLiteral | ObjectLiteral[]): string;
    /**
     * Gets SQL needs to be inserted into final query.
     */
    protected computeFindOperatorExpression(operator: FindOperator<any>, aliasPath: string, parameters: any[]): string;
    /**
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    protected obtainQueryRunner(): QueryRunner;
}
