/*!
 */
import {DriverOptions} from "./driver/DriverOptions";
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
import {MongoRepository} from "./repository/MongoRepository";
import {ConnectionOptionsReader} from "./connection/ConnectionOptionsReader";

// -------------------------------------------------------------------------
// Commonly Used exports
// -------------------------------------------------------------------------

export * from "./container";
export * from "./common/ObjectType";
export * from "./common/ObjectLiteral";
export * from "./decorator/columns/Column";
export * from "./decorator/columns/CreateDateColumn";
export * from "./decorator/columns/DiscriminatorColumn";
export * from "./decorator/columns/PrimaryGeneratedColumn";
export * from "./decorator/columns/PrimaryColumn";
export * from "./decorator/columns/UpdateDateColumn";
export * from "./decorator/columns/VersionColumn";
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
export * from "./decorator/relations/RelationCount";
export * from "./decorator/relations/JoinColumn";
export * from "./decorator/relations/JoinTable";
export * from "./decorator/relations/ManyToMany";
export * from "./decorator/relations/ManyToOne";
export * from "./decorator/relations/OneToMany";
export * from "./decorator/relations/OneToOne";
export * from "./decorator/relations/RelationCount";
export * from "./decorator/relations/RelationId";
export * from "./decorator/entity/Entity";
export * from "./decorator/entity/AbstractEntity";
export * from "./decorator/entity/ClassEntityChild";
export * from "./decorator/entity/ClosureEntity";
export * from "./decorator/entity/EmbeddableEntity";
export * from "./decorator/entity/SingleEntityChild";
export * from "./decorator/entity/Entity";
export * from "./decorator/entity/TableInheritance";
export * from "./decorator/transaction/Transaction";
export * from "./decorator/transaction/TransactionEntityManager";
export * from "./decorator/tree/TreeLevelColumn";
export * from "./decorator/tree/TreeParent";
export * from "./decorator/tree/TreeChildren";
export * from "./decorator/Index";
export * from "./decorator/Embedded";
export * from "./decorator/DiscriminatorValue";
export * from "./decorator/EntityRepository";
export * from "./schema-builder/schema/ColumnSchema";
export * from "./schema-builder/schema/ForeignKeySchema";
export * from "./schema-builder/schema/IndexSchema";
export * from "./schema-builder/schema/PrimaryKeySchema";
export * from "./schema-builder/schema/TableSchema";
export * from "./driver/mongodb/typings";
export * from "./driver/sqlserver/MssqlParameter";

export {ConnectionOptionsReader} from "./connection/ConnectionOptionsReader";
export {Connection} from "./connection/Connection";
export {ConnectionManager} from "./connection/ConnectionManager";
export {ConnectionOptions} from "./connection/ConnectionOptions";
export {DriverOptions} from "./driver/DriverOptions";
export {Driver} from "./driver/Driver";
export {QueryBuilder} from "./query-builder/QueryBuilder";
export {QueryRunner} from "./query-runner/QueryRunner";
export {EntityManager} from "./entity-manager/EntityManager";
export {MongoEntityManager} from "./entity-manager/MongoEntityManager";
export {MigrationInterface} from "./migration/MigrationInterface";
export {DefaultNamingStrategy} from "./naming-strategy/DefaultNamingStrategy";
export {NamingStrategyInterface} from "./naming-strategy/NamingStrategyInterface";
export {Repository} from "./repository/Repository";
export {TreeRepository} from "./repository/TreeRepository";
export {MongoRepository} from "./repository/MongoRepository";
export {FindOneOptions} from "./find-options/FindOneOptions";
export {FindManyOptions} from "./find-options/FindManyOptions";
export {InsertEvent} from "./subscriber/event/InsertEvent";
export {UpdateEvent} from "./subscriber/event/UpdateEvent";
export {RemoveEvent} from "./subscriber/event/RemoveEvent";
export {EntitySubscriberInterface} from "./subscriber/EntitySubscriberInterface";
export {BaseEntity} from "./repository/BaseEntity";

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
 * Gets a ConnectionManager which creates connections.
 */
export function getConnectionManager(): ConnectionManager {
    return getFromContainer(ConnectionManager);
}

/**
 * Creates a new connection and registers it in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 */
export async function createConnection(options?: ConnectionOptions): Promise<Connection> {
    if (!options)
        options = await new ConnectionOptionsReader().get("default");

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

    return Promise.all(options.map(options => getConnectionManager().create(options).connect()));
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
export function getEntityManager(connectionName: string = "default"): EntityManager {
    return getConnectionManager().get(connectionName).manager;
}

/**
 * Gets repository for the given entity class.
 */
export function getRepository<Entity>(entityClass: ObjectType<Entity>|string, connectionName: string = "default"): Repository<Entity> {
    return getConnectionManager().get(connectionName).getRepository<Entity>(entityClass);
}

/**
 * Gets tree repository for the given entity class.
 */
export function getTreeRepository<Entity>(entityClass: ObjectType<Entity>|string, connectionName: string = "default"): TreeRepository<Entity> {
    return getConnectionManager().get(connectionName).getTreeRepository<Entity>(entityClass);
}

/**
 * Gets mongodb repository for the given entity class or name.
 */
export function getMongoRepository<Entity>(entityClass: ObjectType<Entity>|string, connectionName: string = "default"): MongoRepository<Entity> {
    return getConnectionManager().get(connectionName).getMongoRepository<Entity>(entityClass);
}
