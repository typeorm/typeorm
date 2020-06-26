import { ConnectionOptions, getFromContainer, PromiseUtils } from '@typeorm/browser-core';
import { ConnectionOptionsReader } from './lib/options-reader/ConnectionOptionsReader';
import { Connection } from './lib/connection/Connection';
import { ConnectionManager } from './lib/connection/ConnectionManager';

export * from './lib/options-reader/ConnectionOptionsReader';

export * from './lib/connection/Connection';
export * from './lib/connection/ConnectionManager';
export * from './lib/platform/PlatformTools';

export {
    useContainer,
    getFromContainer,
    QueryFailedError,
    ConnectionIsNotSetError,
    DriverPackageNotInstalledError,
    TransactionAlreadyStartedError,
    TransactionNotStartedError,
    QueryRunnerAlreadyReleasedError,
    DriverOptionNotSetError,
    SubjectWithoutIdentifierError,
    MissingDriverError,
    LockNotSupportedOnGivenDriverError,
    OptimisticLockVersionMismatchError,
    NoVersionOrUpdateDateColumnError,
    OptimisticLockCanNotBeUsedError,
    PessimisticLockTransactionRequiredError,
    CannotGetEntityManagerNotConnectedError,
    NoConnectionForRepositoryError,
    ColumnOptions,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    PrimaryGeneratedColumn,
    PrimaryColumn,
    UpdateDateColumn,
    VersionColumn,
    ViewColumn,
    ObjectIdColumn,
    AfterInsert,
    AfterLoad,
    AfterRemove,
    AfterUpdate,
    BeforeInsert,
    BeforeRemove,
    BeforeUpdate,
    EventSubscriber,
    JoinColumn,
    JoinColumnOptions,
    JoinOptions,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    RelationCount,
    RelationId,
    Entity,
    ChildEntity,
    TableInheritance,
    ViewEntity,
    Transaction,
    TransactionManager,
    TransactionRepository,
    TreeLevelColumn,
    TreeParent,
    TreeChildren,
    Tree,
    Index,
    Unique,
    Check,
    Exclusion,
    Generated,
    EntityRepository,
    Any,
    Between,
    Equal,
    In,
    IsNull,
    LessThan,
    LessThanOrEqual,
    Like,
    MoreThan,
    MoreThanOrEqual,
    Not,
    Raw,
    FindOperator,
    FindOptionsUtils,
    SimpleConsoleLogger,
    EntityMetadata,
    ColumnMetadata,
    IndexMetadata,
    EntityManager,
    EntityPersistExecutor,
    Subject,
    SubjectExecutor,
    ClosureSubjectExecutor,
    MaterializedPathSubjectExecutor,
    NestedSetSubjectExecutor,
    Migration,
    MigrationExecutor,
    AbstractRepository,
    Repository,
    BaseEntity,
    TreeRepository,
    TableCheck,
    TableColumn,
    TableExclusion,
    TableForeignKey,
    TableIndex,
    TableUnique,
    Table,
    TableOptions,
    TableCheckOptions,
    RdbmsSchemaBuilder,
    View,
    MssqlParameter,
    DriverUtils,
    Query,
    SqlInMemory,
    QueryBuilder,
    UpdateQueryBuilder,
    RelationQueryBuilder,
    DeleteQueryBuilder,
    SelectQueryBuilder,
    InsertQueryBuilder,
    SoftDeleteQueryBuilder,
    Brackets,
    InsertResult,
    UpdateResult,
    DeleteResult,
    DocumentToEntityTransformer,
    BaseQueryRunner,
    DefaultNamingStrategy,
    Broadcaster,
    BroadcasterResult,
    EntitySchema,
    PromiseUtils,
    ApplyValueTransformers,
    DateUtils,
    OrmUtils,
    VersionUtils,
    camelCase,
    snakeCase,
    titleCase,
    abbreviate,
    shorten,
    hash,
    ObjectUtils,
    getMetadataArgsStorage,
    getConnection,
    getManager,
    getRepository,
    getTreeRepository,
    getCustomRepository,
    createQueryBuilder,
    ContainerInterface,
    ContainedType,
    JoinTableOptions,
    SchemaBuilder,
    ObjectType,
    QueryRunner,
    ObjectLiteral,
    Driver,
    BaseConnectionOptions,
    ColumnType,
    ConnectionOptions,
    DatabaseType,
    DataTypeDefaults,
    DeepPartial,
    EntityOptions,
    EntitySchemaColumnOptions,
    EntitySchemaIndexOptions,
    EntitySchemaRelationOptions,
    EntitySubscriberInterface,
    FindConditions,
    FindManyOptions,
    FindOneOptions,
    FindOperatorType,
    IndexOptions,
    InsertEvent,
    IShortenOptions,
    IsolationLevel,
    Logger,
    MappedColumnTypes,
    MigrationInterface,
    NamingStrategyInterface,
    PrimaryGeneratedColumnType,
    QueryDeepPartialEntity,
    QueryPartialEntity,
    QueryResultCache,
    QueryResultCacheOptions,
    OrderByCondition,
    RelationOptions,
    RemoveEvent,
    RemoveOptions,
    SaveOptions,
    SimpleColumnType,
    SpatialColumnType,
    TableColumnOptions,
    TableExclusionOptions,
    TableForeignKeyOptions,
    TableIndexOptions,
    TableUniqueOptions,
    UpdateEvent,
    UseContainerOptions,
    ValueTransformer,
    Version,
    ViewOptions,
    WhereExpression,
    WithLengthColumnType,
    WithPrecisionColumnType,
    WithWidthColumnType,
    ColumnMetadataArgs,
    CheckMetadata,
    ExclusionMetadata,
    UniqueMetadata,
    ForeignKeyMetadata,
    EntityMetadataValidator,
    InitializedRelationError,
    MetadataUtils,
    EntityColumnNotFound,
    LimitOnUpdateNotSupportedError,
    MissingDeleteDateColumnError,
    UpdateValuesMissingError,
    EntityNotFoundError,
    FindRelationsNotFoundError,
    OffsetWithoutLimitNotSupportedError,
    EntitySchemaOptions,
    LoadEvent,
    ReturningStatementNotSupportedError
} from '@typeorm/browser-core';
export { Connection };
export * from './lib/connection/ConnectionMetadataBuilder';

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
export function createConnection(optionsOrName?: any): Promise<Connection> {
    return getConnectionManager().create(optionsOrName).connect();
}

/**
 * Creates new connections and registers them in the manager.
 *
 * If connection options were not specified, then it will try to create connection automatically,
 * based on content of ormconfig (json/js/yml/xml/env) file or environment variables.
 * All connections from the ormconfig will be created.
 */
export async function createConnections(options: ConnectionOptions[]): Promise<Connection[]> {
    const connections = options.map(options => getConnectionManager().create(options));
    return PromiseUtils.runInSequence(connections, connection => connection.connect());
}
