"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/*!
 */
require("reflect-metadata");
var ConnectionManager_1 = require("./connection/ConnectionManager");
var MetadataArgsStorage_1 = require("./metadata-args/MetadataArgsStorage");
var container_1 = require("./container");
var PlatformTools_1 = require("./platform/PlatformTools");
var ConnectionOptionsReader_1 = require("./connection/ConnectionOptionsReader");
var PromiseUtils_1 = require("./util/PromiseUtils");
// -------------------------------------------------------------------------
// Commonly Used exports
// -------------------------------------------------------------------------
tslib_1.__exportStar(require("./container"), exports);
tslib_1.__exportStar(require("./error/QueryFailedError"), exports);
tslib_1.__exportStar(require("./decorator/columns/Column"), exports);
tslib_1.__exportStar(require("./decorator/columns/CreateDateColumn"), exports);
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
tslib_1.__exportStar(require("./find-options/operator/Like"), exports);
tslib_1.__exportStar(require("./find-options/operator/MoreThan"), exports);
tslib_1.__exportStar(require("./find-options/operator/MoreThanOrEqual"), exports);
tslib_1.__exportStar(require("./find-options/operator/Not"), exports);
tslib_1.__exportStar(require("./find-options/operator/Raw"), exports);
tslib_1.__exportStar(require("./find-options/FindOperator"), exports);
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
tslib_1.__exportStar(require("./schema-builder/table/TableCheck"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableColumn"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableExclusion"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableForeignKey"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableIndex"), exports);
tslib_1.__exportStar(require("./schema-builder/table/TableUnique"), exports);
tslib_1.__exportStar(require("./schema-builder/table/Table"), exports);
tslib_1.__exportStar(require("./driver/mongodb/typings"), exports);
tslib_1.__exportStar(require("./driver/sqlserver/MssqlParameter"), exports);
var ConnectionOptionsReader_2 = require("./connection/ConnectionOptionsReader");
exports.ConnectionOptionsReader = ConnectionOptionsReader_2.ConnectionOptionsReader;
var Connection_1 = require("./connection/Connection");
exports.Connection = Connection_1.Connection;
var ConnectionManager_2 = require("./connection/ConnectionManager");
exports.ConnectionManager = ConnectionManager_2.ConnectionManager;
var QueryBuilder_1 = require("./query-builder/QueryBuilder");
exports.QueryBuilder = QueryBuilder_1.QueryBuilder;
var SelectQueryBuilder_1 = require("./query-builder/SelectQueryBuilder");
exports.SelectQueryBuilder = SelectQueryBuilder_1.SelectQueryBuilder;
var DeleteQueryBuilder_1 = require("./query-builder/DeleteQueryBuilder");
exports.DeleteQueryBuilder = DeleteQueryBuilder_1.DeleteQueryBuilder;
var InsertQueryBuilder_1 = require("./query-builder/InsertQueryBuilder");
exports.InsertQueryBuilder = InsertQueryBuilder_1.InsertQueryBuilder;
var UpdateQueryBuilder_1 = require("./query-builder/UpdateQueryBuilder");
exports.UpdateQueryBuilder = UpdateQueryBuilder_1.UpdateQueryBuilder;
var RelationQueryBuilder_1 = require("./query-builder/RelationQueryBuilder");
exports.RelationQueryBuilder = RelationQueryBuilder_1.RelationQueryBuilder;
var Brackets_1 = require("./query-builder/Brackets");
exports.Brackets = Brackets_1.Brackets;
var InsertResult_1 = require("./query-builder/result/InsertResult");
exports.InsertResult = InsertResult_1.InsertResult;
var UpdateResult_1 = require("./query-builder/result/UpdateResult");
exports.UpdateResult = UpdateResult_1.UpdateResult;
var DeleteResult_1 = require("./query-builder/result/DeleteResult");
exports.DeleteResult = DeleteResult_1.DeleteResult;
var EntityManager_1 = require("./entity-manager/EntityManager");
exports.EntityManager = EntityManager_1.EntityManager;
var MongoEntityManager_1 = require("./entity-manager/MongoEntityManager");
exports.MongoEntityManager = MongoEntityManager_1.MongoEntityManager;
var DefaultNamingStrategy_1 = require("./naming-strategy/DefaultNamingStrategy");
exports.DefaultNamingStrategy = DefaultNamingStrategy_1.DefaultNamingStrategy;
var Repository_1 = require("./repository/Repository");
exports.Repository = Repository_1.Repository;
var TreeRepository_1 = require("./repository/TreeRepository");
exports.TreeRepository = TreeRepository_1.TreeRepository;
var MongoRepository_1 = require("./repository/MongoRepository");
exports.MongoRepository = MongoRepository_1.MongoRepository;
var BaseEntity_1 = require("./repository/BaseEntity");
exports.BaseEntity = BaseEntity_1.BaseEntity;
var EntitySchema_1 = require("./entity-schema/EntitySchema");
exports.EntitySchema = EntitySchema_1.EntitySchema;
var PromiseUtils_2 = require("./util/PromiseUtils");
exports.PromiseUtils = PromiseUtils_2.PromiseUtils;
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
    var globalScope = PlatformTools_1.PlatformTools.getGlobalVariable();
    if (!globalScope.typeormMetadataArgsStorage)
        globalScope.typeormMetadataArgsStorage = new MetadataArgsStorage_1.MetadataArgsStorage();
    return globalScope.typeormMetadataArgsStorage;
}
exports.getMetadataArgsStorage = getMetadataArgsStorage;
/**
 * Reads connection options stored in ormconfig configuration file.
 */
function getConnectionOptions(connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            return [2 /*return*/, new ConnectionOptionsReader_1.ConnectionOptionsReader().get(connectionName)];
        });
    });
}
exports.getConnectionOptions = getConnectionOptions;
/**
 * Gets a ConnectionManager which creates connections.
 */
function getConnectionManager() {
    return container_1.getFromContainer(ConnectionManager_1.ConnectionManager);
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
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var connectionName, options, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    connectionName = typeof optionsOrName === "string" ? optionsOrName : "default";
                    if (!(optionsOrName instanceof Object)) return [3 /*break*/, 1];
                    _a = optionsOrName;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, getConnectionOptions(connectionName)];
                case 2:
                    _a = _b.sent();
                    _b.label = 3;
                case 3:
                    options = _a;
                    return [2 /*return*/, getConnectionManager().create(options).connect()];
            }
        });
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
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var connections;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!options) return [3 /*break*/, 2];
                    return [4 /*yield*/, new ConnectionOptionsReader_1.ConnectionOptionsReader().all()];
                case 1:
                    options = _a.sent();
                    _a.label = 2;
                case 2:
                    connections = options.map(function (options) { return getConnectionManager().create(options); });
                    return [2 /*return*/, PromiseUtils_1.PromiseUtils.runInSequence(connections, function (connection) { return connection.connect(); })];
            }
        });
    });
}
exports.createConnections = createConnections;
/**
 * Gets connection from the connection manager.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
function getConnection(connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return getConnectionManager().get(connectionName);
}
exports.getConnection = getConnection;
/**
 * Gets entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
function getManager(connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return getConnectionManager().get(connectionName).manager;
}
exports.getManager = getManager;
/**
 * Gets MongoDB entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
function getMongoManager(connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return getConnectionManager().get(connectionName).manager;
}
exports.getMongoManager = getMongoManager;
/**
 * Gets Sqljs entity manager from connection name.
 * "default" connection is used, when no name is specified.
 * Only works when Sqljs driver is used.
 */
function getSqljsManager(connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return getConnectionManager().get(connectionName).manager;
}
exports.getSqljsManager = getSqljsManager;
/**
 * Gets repository for the given entity class.
 */
function getRepository(entityClass, connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return getConnectionManager().get(connectionName).getRepository(entityClass);
}
exports.getRepository = getRepository;
/**
 * Gets tree repository for the given entity class.
 */
function getTreeRepository(entityClass, connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return getConnectionManager().get(connectionName).getTreeRepository(entityClass);
}
exports.getTreeRepository = getTreeRepository;
/**
 * Gets tree repository for the given entity class.
 */
function getCustomRepository(customRepository, connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return getConnectionManager().get(connectionName).getCustomRepository(customRepository);
}
exports.getCustomRepository = getCustomRepository;
/**
 * Gets mongodb repository for the given entity class or name.
 */
function getMongoRepository(entityClass, connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    return getConnectionManager().get(connectionName).getMongoRepository(entityClass);
}
exports.getMongoRepository = getMongoRepository;
/**
 * Creates a new query builder.
 */
function createQueryBuilder(entityClass, alias, connectionName) {
    if (connectionName === void 0) { connectionName = "default"; }
    if (entityClass) {
        return getRepository(entityClass, connectionName).createQueryBuilder(alias);
    }
    return getConnection(connectionName).createQueryBuilder();
}
exports.createQueryBuilder = createQueryBuilder;
//# sourceMappingURL=index.js.map