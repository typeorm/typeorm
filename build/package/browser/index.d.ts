/*!
 */
import "reflect-metadata";
import { ConnectionManager } from "./connection/ConnectionManager";
import { Connection } from "./connection/Connection";
import { MetadataArgsStorage } from "./metadata-args/MetadataArgsStorage";
import { ConnectionOptions } from "./connection/ConnectionOptions";
import { ObjectType } from "./common/ObjectType";
import { Repository } from "./repository/Repository";
import { EntityManager } from "./entity-manager/EntityManager";
import { TreeRepository } from "./repository/TreeRepository";
import { MongoRepository } from "./repository/MongoRepository";
import { MongoEntityManager } from "./entity-manager/MongoEntityManager";
import { SqljsEntityManager } from "./entity-manager/SqljsEntityManager";
import { SelectQueryBuilder } from "./query-builder/SelectQueryBuilder";
import { EntityTarget } from "./common/EntityTarget";
import { ObjectLiteral } from "./common/ObjectLiteral";
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
export { ConnectionOptions } from "./connection/ConnectionOptions";
export { Driver } from "./driver/Driver";
export { QueryBuilder } from "./query-builder/QueryBuilder";
export { SelectQueryBuilder } from "./query-builder/SelectQueryBuilder";
export { DeleteQueryBuilder } from "./query-builder/DeleteQueryBuilder";
export { InsertQueryBuilder } from "./query-builder/InsertQueryBuilder";
export { UpdateQueryBuilder } from "./query-builder/UpdateQueryBuilder";
export { RelationQueryBuilder } from "./query-builder/RelationQueryBuilder";
export { Brackets } from "./query-builder/Brackets";
export { WhereExpression } from "./query-builder/WhereExpression";
export { InsertResult } from "./query-builder/result/InsertResult";
export { UpdateResult } from "./query-builder/result/UpdateResult";
export { DeleteResult } from "./query-builder/result/DeleteResult";
export { QueryRunner } from "./query-runner/QueryRunner";
export { MongoEntityManager } from "./entity-manager/MongoEntityManager";
export { Migration } from "./migration/Migration";
export { MigrationExecutor } from "./migration/MigrationExecutor";
export { MigrationInterface } from "./migration/MigrationInterface";
export { DefaultNamingStrategy } from "./naming-strategy/DefaultNamingStrategy";
export { NamingStrategyInterface } from "./naming-strategy/NamingStrategyInterface";
export { FindOneOptions } from "./find-options/FindOneOptions";
export { FindManyOptions } from "./find-options/FindManyOptions";
export { InsertEvent } from "./subscriber/event/InsertEvent";
export { LoadEvent } from "./subscriber/event/LoadEvent";
export { UpdateEvent } from "./subscriber/event/UpdateEvent";
export { RemoveEvent } from "./subscriber/event/RemoveEvent";
export { EntitySubscriberInterface } from "./subscriber/EntitySubscriberInterface";
export { EntitySchema } from "./entity-schema/EntitySchema";
export { EntitySchemaColumnOptions } from "./entity-schema/EntitySchemaColumnOptions";
export { EntitySchemaIndexOptions } from "./entity-schema/EntitySchemaIndexOptions";
export { EntitySchemaRelationOptions } from "./entity-schema/EntitySchemaRelationOptions";
export { ColumnType } from "./driver/types/ColumnTypes";
/**
 * Gets metadata args storage.
 */
export declare function getMetadataArgsStorage(): MetadataArgsStorage;
/**
 * Reads connection options stored in ormconfig configuration file.
 */
export declare function getConnectionOptions(connectionName?: string): Promise<ConnectionOptions>;
/**
 * Gets a ConnectionManager which creates connections.
 */
export declare function getConnectionManager(): ConnectionManager;
/**
 * Creates a new connection and registers it in the manager.
 * Only one connection from ormconfig will be created (name "default" or connection without name).
 */
export declare function createConnection(): Promise<Connection>;
/**
 * Creates a new connection from the ormconfig file with a given name.
 */
export declare function createConnection(name: string): Promise<Connection>;
/**
 * Creates a new connection and registers it in the manager.
 */
export declare function createConnection(options: ConnectionOptions): Promise<Connection>;
/**
 * Creates new connections and registers them in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * All connections from the ormconfig will be created.
 */
export declare function createConnections(options?: ConnectionOptions[]): Promise<Connection[]>;
/**
 * Gets connection from the connection manager.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export declare function getConnection(connectionName?: string): Connection;
/**
 * Gets entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export declare function getManager(connectionName?: string): EntityManager;
/**
 * Gets MongoDB entity manager from the connection.
 * If connection name wasn't specified, then "default" connection will be retrieved.
 */
export declare function getMongoManager(connectionName?: string): MongoEntityManager;
/**
 * Gets Sqljs entity manager from connection name.
 * "default" connection is used, when no name is specified.
 * Only works when Sqljs driver is used.
 */
export declare function getSqljsManager(connectionName?: string): SqljsEntityManager;
/**
 * Gets repository for the given entity class.
 */
export declare function getRepository<Entity extends ObjectLiteral>(entityClass: EntityTarget<Entity>, connectionName?: string): Repository<Entity>;
/**
 * Gets tree repository for the given entity class.
 */
export declare function getTreeRepository<Entity extends ObjectLiteral>(entityClass: EntityTarget<Entity>, connectionName?: string): TreeRepository<Entity>;
/**
 * Gets tree repository for the given entity class.
 */
export declare function getCustomRepository<T>(customRepository: ObjectType<T>, connectionName?: string): T;
/**
 * Gets mongodb repository for the given entity class or name.
 */
export declare function getMongoRepository<Entity extends ObjectLiteral>(entityClass: EntityTarget<Entity>, connectionName?: string): MongoRepository<Entity>;
/**
 * Creates a new query builder.
 */
export declare function createQueryBuilder<Entity extends ObjectLiteral>(entityClass?: EntityTarget<Entity>, alias?: string, connectionName?: string): SelectQueryBuilder<Entity>;
