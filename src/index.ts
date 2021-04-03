/*!
 */
import "reflect-metadata";
import {ConnectionManager} from "./connection/ConnectionManager";
import {Connection} from "./connection/Connection";
import {MetadataArgsStorage} from "./metadata-args/MetadataArgsStorage";
import {ConnectionOptions} from "./connection/ConnectionOptions";
import {getFromContainer} from "./container";
import {ObjectType} from "./common/ObjectType";
import {Repository} from "./repository/Repository";
import {EntityManager} from "./entity-manager/EntityManager";
import {PlatformTools} from "./platform/PlatformTools";
import {TreeRepository} from "./repository/TreeRepository";
import {MongoRepository} from "./driver/mongodb/MongoRepository";
import {ConnectionOptionsReader} from "./connection/ConnectionOptionsReader";
import {MongoEntityManager} from "./driver/mongodb/MongoEntityManager";
import {SqljsEntityManager} from "./driver/sqljs/SqljsEntityManager";
import {SelectQueryBuilder} from "./query-builder/builder/SelectQueryBuilder";
import {EntityTarget} from "./common/EntityTarget";

// -------------------------------------------------------------------------
// Commonly Used exports
// -------------------------------------------------------------------------

export * from "./container";
export * from "./common/EntityTarget";
export * from "./common/ObjectType";
export * from "./common/ObjectLiteral";
export * from "./common/DeepPartial";
export * from "./error";
export * from "./decorator/columns/Column";
export * from "./decorator/columns/CreateDateColumn";
export * from "./decorator/columns/DeleteDateColumn";
export * from "./decorator/columns/PrimaryGeneratedColumn";
export * from "./decorator/columns/PrimaryColumn";
export * from "./decorator/columns/UpdateDateColumn";
export * from "./decorator/columns/VersionColumn";
export * from "./decorator/columns/ViewColumn";
export * from "./decorator/columns/ObjectIdColumn";
export * from "./decorator/listeners/AfterInsert";
export * from "./decorator/listeners/AfterLoad";
export * from "./decorator/listeners/AfterRemove";
export * from "./decorator/listeners/AfterUpdate";
export * from "./decorator/listeners/BeforeInsert";
export * from "./decorator/listeners/BeforeRemove";
export * from "./decorator/listeners/BeforeUpdate";
export * from "./decorator/listeners/EventSubscriber";
export * from "./decorator/options/ColumnOptions";
export * from "./decorator/options/IndexOptions";
export * from "./decorator/options/JoinColumnOptions";
export * from "./decorator/options/JoinTableOptions";
export * from "./decorator/options/RelationOptions";
export * from "./decorator/options/EntityOptions";
export * from "./decorator/options/ValueTransformer";
export * from "./decorator/relations/JoinColumn";
export * from "./decorator/relations/JoinTable";
export * from "./decorator/relations/ManyToMany";
export * from "./decorator/relations/ManyToOne";
export * from "./decorator/relations/OneToMany";
export * from "./decorator/relations/OneToOne";
export * from "./decorator/relations/RelationCount";
export * from "./decorator/relations/RelationId";
export * from "./decorator/entity/Entity";
export * from "./decorator/entity/ChildEntity";
export * from "./decorator/entity/TableInheritance";
export * from "./decorator/entity-view/ViewEntity";
export * from "./decorator/transaction/Transaction";
export * from "./decorator/transaction/TransactionManager";
export * from "./decorator/transaction/TransactionRepository";
export * from "./decorator/tree/TreeLevelColumn";
export * from "./decorator/tree/TreeParent";
export * from "./decorator/tree/TreeChildren";
export * from "./decorator/tree/Tree";
export * from "./decorator/Index";
export * from "./decorator/Unique";
export * from "./decorator/Check";
export * from "./decorator/Exclusion";
export * from "./decorator/Generated";
export * from "./decorator/EntityRepository";
export * from "./expression-builder/expression/aggregate/Count";
export * from "./expression-builder/expression/bitwise/And";
export * from "./expression-builder/expression/bitwise/LeftShift";
export * from "./expression-builder/expression/bitwise/Or";
export * from "./expression-builder/expression/bitwise/RightShift";
export * from "./expression-builder/expression/bitwise/Xor";
export * from "./expression-builder/expression/comparison/quantifier/All";
export * from "./expression-builder/expression/comparison/quantifier/Any";
export * from "./expression-builder/expression/comparison/quantifier/Some";
export * from "./expression-builder/expression/comparison/Between";
export * from "./expression-builder/expression/comparison/Equal";
export * from "./expression-builder/expression/comparison/ILike";
export * from "./expression-builder/expression/comparison/In";
export * from "./expression-builder/expression/comparison/Is";
export * from "./expression-builder/expression/comparison/LessThan";
export * from "./expression-builder/expression/comparison/LessThanOrEqual";
export * from "./expression-builder/expression/comparison/Like";
export * from "./expression-builder/expression/comparison/MoreThan";
export * from "./expression-builder/expression/comparison/MoreThanOrEqual";
export * from "./expression-builder/expression/comparison/Not";
export * from "./expression-builder/expression/conditional/Case";
export * from "./expression-builder/expression/conditional/Coalesce";
export * from "./expression-builder/expression/conditional/If";
export * from "./expression-builder/expression/conditional/IfNull";
export * from "./expression-builder/expression/conditional/NullIf";
export * from "./expression-builder/expression/datetime/CurrentDate";
export * from "./expression-builder/expression/datetime/CurrentTime";
export * from "./expression-builder/expression/datetime/CurrentTimestamp";
export * from "./expression-builder/expression/logical/And";
export * from "./expression-builder/expression/logical/Or";
export * from "./expression-builder/expression/logical/Xor";
export * from "./expression-builder/expression/misc/Cast";
export * from "./expression-builder/expression/misc/Default";
export * from "./expression-builder/expression/misc/Null";
export * from "./expression-builder/expression/numerical/operator/Add";
export * from "./expression-builder/expression/numerical/operator/Divide";
export * from "./expression-builder/expression/numerical/operator/IntDivide";
export * from "./expression-builder/expression/numerical/operator/Modulo";
export * from "./expression-builder/expression/numerical/operator/Multiply";
export * from "./expression-builder/expression/numerical/operator/Subtract";
export * from "./expression-builder/expression/numerical/operator/UnaryMinus";
export * from "./expression-builder/expression/string/Concat";
export * from "./expression-builder/expression/string/Length";
export * from "./expression-builder/expression/Column";
export * from "./expression-builder/expression/Conditions";
export * from "./expression-builder/expression/ForcedColumnComparator";
export * from "./expression-builder/expression/Function";
export * from "./expression-builder/expression/Literal";
export * from "./expression-builder/expression/Operator";
export * from "./expression-builder/expression/Raw";
export * from "./expression-builder/expression/SubQuery";
export * from "./find-options/FindConditions";
export * from "./find-options/FindManyOptions";
export * from "./find-options/FindOneOptions";
export * from "./find-options/JoinOptions";
export * from "./find-options/OrderByCondition";
export * from "./find-options/FindOptionsUtils";
export * from "./logger/Logger";
export * from "./logger/LoggerOptions";
export * from "./logger/AdvancedConsoleLogger";
export * from "./logger/SimpleConsoleLogger";
export * from "./logger/FileLogger";
export * from "./metadata/EntityMetadata";
export * from "./entity-manager/EntityManager";
export * from "./repository/AbstractRepository";
export * from "./repository/Repository";
export * from "./repository/BaseEntity";
export * from "./repository/TreeRepository";
export * from "./driver/mongodb/MongoRepository";
export * from "./repository/RemoveOptions";
export * from "./repository/SaveOptions";
export * from "./schema-builder/table/TableCheck";
export * from "./schema-builder/table/TableColumn";
export * from "./schema-builder/table/TableExclusion";
export * from "./schema-builder/table/TableForeignKey";
export * from "./schema-builder/table/TableIndex";
export * from "./schema-builder/table/TableUnique";
export * from "./schema-builder/table/Table";
export * from "./driver/mongodb/typings";
export * from "./driver/types/DatabaseType";
export * from "./driver/types/ReplicationMode";
export * from "./driver/sqlserver/MssqlParameter";

export {ConnectionOptionsReader} from "./connection/ConnectionOptionsReader";
export {Connection} from "./connection/Connection";
export {ConnectionManager} from "./connection/ConnectionManager";
export {ConnectionOptions} from "./connection/ConnectionOptions";
export {Driver} from "./driver/Driver";
export {QueryBuilder} from "./query-builder/builder/QueryBuilder";
export {SelectQueryBuilder} from "./query-builder/builder/SelectQueryBuilder";
export {DeleteQueryBuilder} from "./query-builder/builder/DeleteQueryBuilder";
export {InsertQueryBuilder} from "./query-builder/builder/InsertQueryBuilder";
export {UpdateQueryBuilder} from "./query-builder/builder/UpdateQueryBuilder";
export {RelationQueryBuilder} from "./query-builder/builder/RelationQueryBuilder";
export {WhereExpression} from "./query-builder/WhereExpression";
export {InsertResult} from "./query-builder/result/InsertResult";
export {UpdateResult} from "./query-builder/result/UpdateResult";
export {DeleteResult} from "./query-builder/result/DeleteResult";
export {QueryRunner} from "./query-runner/QueryRunner";
export {MongoEntityManager} from "./driver/mongodb/MongoEntityManager";
export {Migration} from "./migration/Migration";
export {MigrationExecutor} from "./migration/MigrationExecutor";
export {MigrationInterface} from "./migration/MigrationInterface";
export {DefaultNamingStrategy} from "./naming-strategy/DefaultNamingStrategy";
export {NamingStrategyInterface} from "./naming-strategy/NamingStrategyInterface";
export {FindOneOptions} from "./find-options/FindOneOptions";
export {FindManyOptions} from "./find-options/FindManyOptions";
export {InsertEvent} from "./subscriber/event/InsertEvent";
export {LoadEvent} from "./subscriber/event/LoadEvent";
export {UpdateEvent} from "./subscriber/event/UpdateEvent";
export {RemoveEvent} from "./subscriber/event/RemoveEvent";
export {EntitySubscriberInterface} from "./subscriber/EntitySubscriberInterface";
export {EntitySchema} from "./entity-schema/EntitySchema";
export {EntitySchemaColumnOptions} from "./entity-schema/EntitySchemaColumnOptions";
export {EntitySchemaIndexOptions} from "./entity-schema/EntitySchemaIndexOptions";
export {EntitySchemaRelationOptions} from "./entity-schema/EntitySchemaRelationOptions";
export {ColumnType} from "./driver/types/ColumnTypes";

// -------------------------------------------------------------------------
// Deprecated
// -------------------------------------------------------------------------

// -------------------------------------------------------------------------
// Commonly used functionality
// -------------------------------------------------------------------------

/**
 * Gets metadata args storage.
 */
export function getMetadataArgsStorage(): MetadataArgsStorage {
    // we should store metadata storage in a global variable otherwise it brings too much problems
    // one of the problem is that if any entity (or any other) will be imported before consumer will call
    // useContainer method with his own container implementation, that entity will be registered in the
    // old old container (default one post probably) and consumer will his entity.
    // calling useContainer before he imports any entity (or any other) is not always convenient.
    // another reason is that when we run migrations typeorm is being called from a global package
    // and it may load entities which register decorators in typeorm of local package
    // this leads to impossibility of usage of entities in migrations and cli related operations
    const globalScope = PlatformTools.getGlobalVariable();
    if (!globalScope.typeormMetadataArgsStorage)
        globalScope.typeormMetadataArgsStorage = new MetadataArgsStorage();

    return globalScope.typeormMetadataArgsStorage;
}

/**
 * Reads connection options stored in ormconfig configuration file.
 */
export async function getConnectionOptions(connectionName: string = "default"): Promise<ConnectionOptions> {
    return new ConnectionOptionsReader().get(connectionName);
}

/**
 * Gets a ConnectionManager which creates connections.
 */
export function getConnectionManager(): ConnectionManager {
    return getFromContainer(ConnectionManager);
}

/**
 * Creates a new connection and registers it in the manager.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 */
export async function createConnection(): Promise<Connection>;

/**
 * Creates a new connection from the ormconfig file with a given name.
 */
export async function createConnection(name: string): Promise<Connection>;

/**
 * Creates a new connection and registers it in the manager.
 */
export async function createConnection(options: ConnectionOptions): Promise<Connection>;

/**
 * Creates a new connection and registers it in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 */
export async function createConnection(optionsOrName?: any): Promise<Connection> {
    const connectionName = typeof optionsOrName === "string" ? optionsOrName : "default";
    const options = optionsOrName instanceof Object ? optionsOrName : await getConnectionOptions(connectionName);
    return getConnectionManager().create(options).connect();
}

/**
 * Creates new connections and registers them in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * All connections from the ormconfig will be created.
 */
export async function createConnections(options?: ConnectionOptions[]): Promise<Connection[]> {
    if (!options)
        options = await new ConnectionOptionsReader().all();
    const connections = options.map(options => getConnectionManager().create(options));
    return Promise.all(connections.map(connection => connection.connect()));
}

/**
 * Gets connection from the connection manager.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getConnection(connectionName: string = "default"): Connection {
    return getConnectionManager().get(connectionName);
}

/**
 * Gets entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getManager(connectionName: string = "default"): EntityManager {
    return getConnectionManager().get(connectionName).manager;
}

/**
 * Gets MongoDB entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getMongoManager(connectionName: string = "default"): MongoEntityManager {
    return getConnectionManager().get(connectionName).manager as MongoEntityManager;
}

/**
 * Gets Sqljs entity manager from connection name.
 * "default" connection is used, when no name is specified.
 * Only works when Sqljs driver is used.
 */
export function getSqljsManager(connectionName: string = "default"): SqljsEntityManager {
    return getConnectionManager().get(connectionName).manager as SqljsEntityManager;
}

/**
 * Gets repository for the given entity class.
 */
export function getRepository<Entity>(entityClass: EntityTarget<Entity>, connectionName: string = "default"): Repository<Entity> {
    return getConnectionManager().get(connectionName).getRepository<Entity>(entityClass);
}

/**
 * Gets tree repository for the given entity class.
 */
export function getTreeRepository<Entity>(entityClass: EntityTarget<Entity>, connectionName: string = "default"): TreeRepository<Entity> {
    return getConnectionManager().get(connectionName).getTreeRepository<Entity>(entityClass);
}

/**
 * Gets tree repository for the given entity class.
 */
export function getCustomRepository<T>(customRepository: ObjectType<T>, connectionName: string = "default"): T {
    return getConnectionManager().get(connectionName).getCustomRepository(customRepository);
}

/**
 * Gets mongodb repository for the given entity class or name.
 */
export function getMongoRepository<Entity>(entityClass: EntityTarget<Entity>, connectionName: string = "default"): MongoRepository<Entity> {
    return getConnectionManager().get(connectionName).getMongoRepository<Entity>(entityClass);
}

/**
 * Creates a new query builder.
 */
export function createQueryBuilder<Entity>(entityClass?: EntityTarget<Entity>, alias?: string, connectionName: string = "default"): SelectQueryBuilder<Entity> {
    if (entityClass) {
        return getRepository(entityClass, connectionName).createQueryBuilder(alias);
    }

    return getConnection(connectionName).createQueryBuilder();
}
