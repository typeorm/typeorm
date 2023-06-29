import { __awaiter } from "tslib";
/*!
 */
import "reflect-metadata";
import { ConnectionManager } from "./connection/ConnectionManager";
import { MetadataArgsStorage } from "./metadata-args/MetadataArgsStorage";
import { getFromContainer } from "./container";
import { PlatformTools } from "./platform/PlatformTools";
import { ConnectionOptionsReader } from "./connection/ConnectionOptionsReader";
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
export * from "./find-options/operator/Any";
export * from "./find-options/operator/Between";
export * from "./find-options/operator/Equal";
export * from "./find-options/operator/In";
export * from "./find-options/operator/IsNull";
export * from "./find-options/operator/LessThan";
export * from "./find-options/operator/LessThanOrEqual";
export * from "./find-options/operator/ILike";
export * from "./find-options/operator/Like";
export * from "./find-options/operator/MoreThan";
export * from "./find-options/operator/MoreThanOrEqual";
export * from "./find-options/operator/Not";
export * from "./find-options/operator/Raw";
export * from "./find-options/FindConditions";
export * from "./find-options/FindManyOptions";
export * from "./find-options/FindOneOptions";
export * from "./find-options/FindOperator";
export * from "./find-options/FindOperatorType";
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
export * from "./repository/MongoRepository";
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
export { ConnectionOptionsReader } from "./connection/ConnectionOptionsReader";
export { Connection } from "./connection/Connection";
export { ConnectionManager } from "./connection/ConnectionManager";
export { QueryBuilder } from "./query-builder/QueryBuilder";
export { SelectQueryBuilder } from "./query-builder/SelectQueryBuilder";
export { DeleteQueryBuilder } from "./query-builder/DeleteQueryBuilder";
export { InsertQueryBuilder } from "./query-builder/InsertQueryBuilder";
export { UpdateQueryBuilder } from "./query-builder/UpdateQueryBuilder";
export { RelationQueryBuilder } from "./query-builder/RelationQueryBuilder";
export { Brackets } from "./query-builder/Brackets";
export { InsertResult } from "./query-builder/result/InsertResult";
export { UpdateResult } from "./query-builder/result/UpdateResult";
export { DeleteResult } from "./query-builder/result/DeleteResult";
export { MongoEntityManager } from "./entity-manager/MongoEntityManager";
export { Migration } from "./migration/Migration";
export { MigrationExecutor } from "./migration/MigrationExecutor";
export { DefaultNamingStrategy } from "./naming-strategy/DefaultNamingStrategy";
export { EntitySchema } from "./entity-schema/EntitySchema";
// -------------------------------------------------------------------------
// Deprecated
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// Commonly used functionality
// -------------------------------------------------------------------------
/**
 * Gets metadata args storage.
 */
export function getMetadataArgsStorage() {
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
export function getConnectionOptions(connectionName = "default") {
    return __awaiter(this, void 0, void 0, function* () {
        return new ConnectionOptionsReader().get(connectionName);
    });
}
/**
 * Gets a ConnectionManager which creates connections.
 */
export function getConnectionManager() {
    return getFromContainer(ConnectionManager);
}
/**
 * Creates a new connection and registers it in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 */
export function createConnection(optionsOrName) {
    return __awaiter(this, void 0, void 0, function* () {
        const connectionName = typeof optionsOrName === "string" ? optionsOrName : "default";
        const options = optionsOrName instanceof Object ? optionsOrName : yield getConnectionOptions(connectionName);
        return getConnectionManager().create(options).connect();
    });
}
/**
 * Creates new connections and registers them in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * All connections from the ormconfig will be created.
 */
export function createConnections(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options)
            options = yield new ConnectionOptionsReader().all();
        const connections = options.map(options => getConnectionManager().create(options));
        return Promise.all(connections.map(connection => connection.connect()));
    });
}
/**
 * Gets connection from the connection manager.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getConnection(connectionName = "default") {
    return getConnectionManager().get(connectionName);
}
/**
 * Gets entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getManager(connectionName = "default") {
    return getConnectionManager().get(connectionName).manager;
}
/**
 * Gets MongoDB entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export function getMongoManager(connectionName = "default") {
    return getConnectionManager().get(connectionName).manager;
}
/**
 * Gets Sqljs entity manager from connection name.
 * "default" connection is used, when no name is specified.
 * Only works when Sqljs driver is used.
 */
export function getSqljsManager(connectionName = "default") {
    return getConnectionManager().get(connectionName).manager;
}
/**
 * Gets repository for the given entity class.
 */
export function getRepository(entityClass, connectionName = "default") {
    return getConnectionManager().get(connectionName).getRepository(entityClass);
}
/**
 * Gets tree repository for the given entity class.
 */
export function getTreeRepository(entityClass, connectionName = "default") {
    return getConnectionManager().get(connectionName).getTreeRepository(entityClass);
}
/**
 * Gets tree repository for the given entity class.
 */
export function getCustomRepository(customRepository, connectionName = "default") {
    return getConnectionManager().get(connectionName).getCustomRepository(customRepository);
}
/**
 * Gets mongodb repository for the given entity class or name.
 */
export function getMongoRepository(entityClass, connectionName = "default") {
    return getConnectionManager().get(connectionName).getMongoRepository(entityClass);
}
/**
 * Creates a new query builder.
 */
export function createQueryBuilder(entityClass, alias, connectionName = "default") {
    if (entityClass) {
        return getRepository(entityClass, connectionName).createQueryBuilder(alias);
    }
    return getConnection(connectionName).createQueryBuilder();
}

//# sourceMappingURL=index.js.map
