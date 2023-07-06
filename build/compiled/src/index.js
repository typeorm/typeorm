"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueryBuilder = exports.getMongoRepository = exports.getCustomRepository = exports.getTreeRepository = exports.getRepository = exports.getSqljsManager = exports.getMongoManager = exports.getManager = exports.getConnection = exports.createConnections = exports.createConnection = exports.getConnectionManager = exports.getConnectionOptions = exports.getMetadataArgsStorage = exports.EntitySchema = exports.DefaultNamingStrategy = exports.MigrationExecutor = exports.Migration = exports.MongoEntityManager = exports.DeleteResult = exports.UpdateResult = exports.InsertResult = exports.Brackets = exports.RelationQueryBuilder = exports.UpdateQueryBuilder = exports.InsertQueryBuilder = exports.DeleteQueryBuilder = exports.SelectQueryBuilder = exports.QueryBuilder = exports.ConnectionManager = exports.Connection = exports.ConnectionOptionsReader = void 0;
const tslib_1 = require("tslib");
/*!
 */
require("reflect-metadata");
const ConnectionManager_1 = require("./connection/ConnectionManager");
const MetadataArgsStorage_1 = require("./metadata-args/MetadataArgsStorage");
const container_1 = require("./container");
const PlatformTools_1 = require("./platform/PlatformTools");
const ConnectionOptionsReader_1 = require("./connection/ConnectionOptionsReader");
// -------------------------------------------------------------------------
// Commonly Used exports
// -------------------------------------------------------------------------
tslib_1.__exportStar(require("./container"), exports);
tslib_1.__exportStar(require("./common/EntityTarget"), exports);
tslib_1.__exportStar(require("./common/ObjectType"), exports);
tslib_1.__exportStar(require("./common/ObjectLiteral"), exports);
tslib_1.__exportStar(require("./common/DeepPartial"), exports);
tslib_1.__exportStar(require("./error"), exports);
tslib_1.__exportStar(require("./decorator/columns/Column"), exports);
tslib_1.__exportStar(require("./decorator/columns/CreateDateColumn"), exports);
tslib_1.__exportStar(require("./decorator/columns/DeleteDateColumn"), exports);
tslib_1.__exportStar(require("./decorator/columns/PrimaryGeneratedColumn"), exports);
tslib_1.__exportStar(require("./decorator/columns/PrimaryColumn"), exports);
tslib_1.__exportStar(require("./decorator/columns/UpdateDateColumn"), exports);
tslib_1.__exportStar(require("./decorator/columns/VersionColumn"), exports);
tslib_1.__exportStar(require("./decorator/columns/ViewColumn"), exports);
tslib_1.__exportStar(require("./decorator/columns/ObjectIdColumn"), exports);
tslib_1.__exportStar(require("./decorator/listeners/AfterInsert"), exports);
tslib_1.__exportStar(require("./decorator/listeners/AfterLoad"), exports);
tslib_1.__exportStar(require("./decorator/listeners/AfterRemove"), exports);
tslib_1.__exportStar(require("./decorator/listeners/AfterUpdate"), exports);
tslib_1.__exportStar(require("./decorator/listeners/BeforeInsert"), exports);
tslib_1.__exportStar(require("./decorator/listeners/BeforeRemove"), exports);
tslib_1.__exportStar(require("./decorator/listeners/BeforeUpdate"), exports);
tslib_1.__exportStar(require("./decorator/listeners/EventSubscriber"), exports);
tslib_1.__exportStar(require("./decorator/options/ColumnOptions"), exports);
tslib_1.__exportStar(require("./decorator/options/IndexOptions"), exports);
tslib_1.__exportStar(require("./decorator/options/JoinColumnOptions"), exports);
tslib_1.__exportStar(require("./decorator/options/JoinTableOptions"), exports);
tslib_1.__exportStar(require("./decorator/options/RelationOptions"), exports);
tslib_1.__exportStar(require("./decorator/options/EntityOptions"), exports);
tslib_1.__exportStar(require("./decorator/options/ValueTransformer"), exports);
tslib_1.__exportStar(require("./decorator/relations/JoinColumn"), exports);
tslib_1.__exportStar(require("./decorator/relations/JoinTable"), exports);
tslib_1.__exportStar(require("./decorator/relations/ManyToMany"), exports);
tslib_1.__exportStar(require("./decorator/relations/ManyToOne"), exports);
tslib_1.__exportStar(require("./decorator/relations/OneToMany"), exports);
tslib_1.__exportStar(require("./decorator/relations/OneToOne"), exports);
tslib_1.__exportStar(require("./decorator/relations/RelationCount"), exports);
tslib_1.__exportStar(require("./decorator/relations/RelationId"), exports);
tslib_1.__exportStar(require("./decorator/entity/Entity"), exports);
tslib_1.__exportStar(require("./decorator/entity/ChildEntity"), exports);
tslib_1.__exportStar(require("./decorator/entity/TableInheritance"), exports);
tslib_1.__exportStar(require("./decorator/entity-view/ViewEntity"), exports);
tslib_1.__exportStar(require("./decorator/transaction/Transaction"), exports);
tslib_1.__exportStar(require("./decorator/transaction/TransactionManager"), exports);
tslib_1.__exportStar(require("./decorator/transaction/TransactionRepository"), exports);
tslib_1.__exportStar(require("./decorator/tree/TreeLevelColumn"), exports);
tslib_1.__exportStar(require("./decorator/tree/TreeParent"), exports);
tslib_1.__exportStar(require("./decorator/tree/TreeChildren"), exports);
tslib_1.__exportStar(require("./decorator/tree/Tree"), exports);
tslib_1.__exportStar(require("./decorator/Index"), exports);
tslib_1.__exportStar(require("./decorator/Unique"), exports);
tslib_1.__exportStar(require("./decorator/Check"), exports);
tslib_1.__exportStar(require("./decorator/Exclusion"), exports);
tslib_1.__exportStar(require("./decorator/Generated"), exports);
tslib_1.__exportStar(require("./decorator/EntityRepository"), exports);
tslib_1.__exportStar(require("./find-options/operator/Any"), exports);
tslib_1.__exportStar(require("./find-options/operator/Between"), exports);
tslib_1.__exportStar(require("./find-options/operator/Equal"), exports);
tslib_1.__exportStar(require("./find-options/operator/In"), exports);
tslib_1.__exportStar(require("./find-options/operator/IsNull"), exports);
tslib_1.__exportStar(require("./find-options/operator/LessThan"), exports);
tslib_1.__exportStar(require("./find-options/operator/LessThanOrEqual"), exports);
tslib_1.__exportStar(require("./find-options/operator/ILike"), exports);
tslib_1.__exportStar(require("./find-options/operator/Like"), exports);
tslib_1.__exportStar(require("./find-options/operator/MoreThan"), exports);
tslib_1.__exportStar(require("./find-options/operator/MoreThanOrEqual"), exports);
tslib_1.__exportStar(require("./find-options/operator/Not"), exports);
tslib_1.__exportStar(require("./find-options/operator/Raw"), exports);
tslib_1.__exportStar(require("./find-options/FindConditions"), exports);
tslib_1.__exportStar(require("./find-options/FindManyOptions"), exports);
tslib_1.__exportStar(require("./find-options/FindOneOptions"), exports);
tslib_1.__exportStar(require("./find-options/FindOperator"), exports);
tslib_1.__exportStar(require("./find-options/FindOperatorType"), exports);
tslib_1.__exportStar(require("./find-options/JoinOptions"), exports);
tslib_1.__exportStar(require("./find-options/OrderByCondition"), exports);
tslib_1.__exportStar(require("./find-options/FindOptionsUtils"), exports);
tslib_1.__exportStar(require("./logger/Logger"), exports);
tslib_1.__exportStar(require("./logger/LoggerOptions"), exports);
tslib_1.__exportStar(require("./logger/AdvancedConsoleLogger"), exports);
tslib_1.__exportStar(require("./logger/SimpleConsoleLogger"), exports);
tslib_1.__exportStar(require("./logger/FileLogger"), exports);
tslib_1.__exportStar(require("./metadata/EntityMetadata"), exports);
tslib_1.__exportStar(require("./entity-manager/EntityManager"), exports);
tslib_1.__exportStar(require("./repository/AbstractRepository"), exports);
tslib_1.__exportStar(require("./repository/Repository"), exports);
tslib_1.__exportStar(require("./repository/BaseEntity"), exports);
tslib_1.__exportStar(require("./repository/TreeRepository"), exports);
tslib_1.__exportStar(require("./repository/MongoRepository"), exports);
tslib_1.__exportStar(require("./repository/RemoveOptions"), exports);
tslib_1.__exportStar(require("./repository/SaveOptions"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableCheck"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableColumn"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableExclusion"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableForeignKey"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableIndex"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableUnique"), exports);
tslib_1.__exportStar(require("./schema-builder/table/Table"), exports);
tslib_1.__exportStar(require("./driver/mongodb/typings"), exports);
tslib_1.__exportStar(require("./driver/types/DatabaseType"), exports);
tslib_1.__exportStar(require("./driver/types/ReplicationMode"), exports);
tslib_1.__exportStar(require("./driver/sqlserver/MssqlParameter"), exports);
var ConnectionOptionsReader_2 = require("./connection/ConnectionOptionsReader");
Object.defineProperty(exports, "ConnectionOptionsReader", { enumerable: true, get: function () { return ConnectionOptionsReader_2.ConnectionOptionsReader; } });
var Connection_1 = require("./connection/Connection");
Object.defineProperty(exports, "Connection", { enumerable: true, get: function () { return Connection_1.Connection; } });
var ConnectionManager_2 = require("./connection/ConnectionManager");
Object.defineProperty(exports, "ConnectionManager", { enumerable: true, get: function () { return ConnectionManager_2.ConnectionManager; } });
var QueryBuilder_1 = require("./query-builder/QueryBuilder");
Object.defineProperty(exports, "QueryBuilder", { enumerable: true, get: function () { return QueryBuilder_1.QueryBuilder; } });
var SelectQueryBuilder_1 = require("./query-builder/SelectQueryBuilder");
Object.defineProperty(exports, "SelectQueryBuilder", { enumerable: true, get: function () { return SelectQueryBuilder_1.SelectQueryBuilder; } });
var DeleteQueryBuilder_1 = require("./query-builder/DeleteQueryBuilder");
Object.defineProperty(exports, "DeleteQueryBuilder", { enumerable: true, get: function () { return DeleteQueryBuilder_1.DeleteQueryBuilder; } });
var InsertQueryBuilder_1 = require("./query-builder/InsertQueryBuilder");
Object.defineProperty(exports, "InsertQueryBuilder", { enumerable: true, get: function () { return InsertQueryBuilder_1.InsertQueryBuilder; } });
var UpdateQueryBuilder_1 = require("./query-builder/UpdateQueryBuilder");
Object.defineProperty(exports, "UpdateQueryBuilder", { enumerable: true, get: function () { return UpdateQueryBuilder_1.UpdateQueryBuilder; } });
var RelationQueryBuilder_1 = require("./query-builder/RelationQueryBuilder");
Object.defineProperty(exports, "RelationQueryBuilder", { enumerable: true, get: function () { return RelationQueryBuilder_1.RelationQueryBuilder; } });
var Brackets_1 = require("./query-builder/Brackets");
Object.defineProperty(exports, "Brackets", { enumerable: true, get: function () { return Brackets_1.Brackets; } });
var InsertResult_1 = require("./query-builder/result/InsertResult");
Object.defineProperty(exports, "InsertResult", { enumerable: true, get: function () { return InsertResult_1.InsertResult; } });
var UpdateResult_1 = require("./query-builder/result/UpdateResult");
Object.defineProperty(exports, "UpdateResult", { enumerable: true, get: function () { return UpdateResult_1.UpdateResult; } });
var DeleteResult_1 = require("./query-builder/result/DeleteResult");
Object.defineProperty(exports, "DeleteResult", { enumerable: true, get: function () { return DeleteResult_1.DeleteResult; } });
var MongoEntityManager_1 = require("./entity-manager/MongoEntityManager");
Object.defineProperty(exports, "MongoEntityManager", { enumerable: true, get: function () { return MongoEntityManager_1.MongoEntityManager; } });
var Migration_1 = require("./migration/Migration");
Object.defineProperty(exports, "Migration", { enumerable: true, get: function () { return Migration_1.Migration; } });
var MigrationExecutor_1 = require("./migration/MigrationExecutor");
Object.defineProperty(exports, "MigrationExecutor", { enumerable: true, get: function () { return MigrationExecutor_1.MigrationExecutor; } });
var DefaultNamingStrategy_1 = require("./naming-strategy/DefaultNamingStrategy");
Object.defineProperty(exports, "DefaultNamingStrategy", { enumerable: true, get: function () { return DefaultNamingStrategy_1.DefaultNamingStrategy; } });
var EntitySchema_1 = require("./entity-schema/EntitySchema");
Object.defineProperty(exports, "EntitySchema", { enumerable: true, get: function () { return EntitySchema_1.EntitySchema; } });
// -------------------------------------------------------------------------
// Deprecated
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// Commonly used functionality
// -------------------------------------------------------------------------
/**
 * Gets metadata args storage.
 */
function getMetadataArgsStorage() {
    // we should store metadata storage in a global variable otherwise it brings too much problems
    // one of the problem is that if any entity (or any other) will be imported before consumer will call
    // useContainer method with his own container implementation, that entity will be registered in the
    // old old container (default one post probably) and consumer will his entity.
    // calling useContainer before he imports any entity (or any other) is not always convenient.
    // another reason is that when we run migrations typeorm is being called from a global package
    // and it may load entities which register decorators in typeorm of local package
    // this leads to impossibility of usage of entities in migrations and cli related operations
    const globalScope = PlatformTools_1.PlatformTools.getGlobalVariable();
    if (!globalScope.typeormMetadataArgsStorage)
        globalScope.typeormMetadataArgsStorage = new MetadataArgsStorage_1.MetadataArgsStorage();
    return globalScope.typeormMetadataArgsStorage;
}
exports.getMetadataArgsStorage = getMetadataArgsStorage;
/**
 * Reads connection options stored in ormconfig configuration file.
 */
function getConnectionOptions(connectionName = "default") {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return new ConnectionOptionsReader_1.ConnectionOptionsReader().get(connectionName);
    });
}
exports.getConnectionOptions = getConnectionOptions;
/**
 * Gets a ConnectionManager which creates connections.
 */
function getConnectionManager() {
    return (0, container_1.getFromContainer)(ConnectionManager_1.ConnectionManager);
}
exports.getConnectionManager = getConnectionManager;
/**
 * Creates a new connection and registers it in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 */
function createConnection(optionsOrName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const connectionName = typeof optionsOrName === "string" ? optionsOrName : "default";
        const options = optionsOrName instanceof Object ? optionsOrName : yield getConnectionOptions(connectionName);
        return getConnectionManager().create(options).connect();
    });
}
exports.createConnection = createConnection;
/**
 * Creates new connections and registers them in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * All connections from the ormconfig will be created.
 */
function createConnections(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!options)
            options = yield new ConnectionOptionsReader_1.ConnectionOptionsReader().all();
        const connections = options.map(options => getConnectionManager().create(options));
        return Promise.all(connections.map(connection => connection.connect()));
    });
}
exports.createConnections = createConnections;
/**
 * Gets connection from the connection manager.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
function getConnection(connectionName = "default") {
    return getConnectionManager().get(connectionName);
}
exports.getConnection = getConnection;
/**
 * Gets entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
function getManager(connectionName = "default") {
    return getConnectionManager().get(connectionName).manager;
}
exports.getManager = getManager;
/**
 * Gets MongoDB entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
function getMongoManager(connectionName = "default") {
    return getConnectionManager().get(connectionName).manager;
}
exports.getMongoManager = getMongoManager;
/**
 * Gets Sqljs entity manager from connection name.
 * "default" connection is used, when no name is specified.
 * Only works when Sqljs driver is used.
 */
function getSqljsManager(connectionName = "default") {
    return getConnectionManager().get(connectionName).manager;
}
exports.getSqljsManager = getSqljsManager;
/**
 * Gets repository for the given entity class.
 */
function getRepository(entityClass, connectionName = "default") {
    return getConnectionManager().get(connectionName).getRepository(entityClass);
}
exports.getRepository = getRepository;
/**
 * Gets tree repository for the given entity class.
 */
function getTreeRepository(entityClass, connectionName = "default") {
    return getConnectionManager().get(connectionName).getTreeRepository(entityClass);
}
exports.getTreeRepository = getTreeRepository;
/**
 * Gets tree repository for the given entity class.
 */
function getCustomRepository(customRepository, connectionName = "default") {
    return getConnectionManager().get(connectionName).getCustomRepository(customRepository);
}
exports.getCustomRepository = getCustomRepository;
/**
 * Gets mongodb repository for the given entity class or name.
 */
function getMongoRepository(entityClass, connectionName = "default") {
    return getConnectionManager().get(connectionName).getMongoRepository(entityClass);
}
exports.getMongoRepository = getMongoRepository;
/**
 * Creates a new query builder.
 */
function createQueryBuilder(entityClass, alias, connectionName = "default") {
    if (entityClass) {
        return getRepository(entityClass, connectionName).createQueryBuilder(alias);
    }
    return getConnection(connectionName).createQueryBuilder();
}
exports.createQueryBuilder = createQueryBuilder;
//# sourceMappingURL=index.js.map