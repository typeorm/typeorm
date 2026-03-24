import { connectionToDataSource } from "./connection-to-datasource"
import { globalFunctions } from "./global-functions"
import { repositoryFindByIds } from "./repository-find-by-ids"
import { repositoryFindOneById } from "./repository-find-one-by-id"
import { repositoryExist } from "./repository-exist"
import { queryBuilderPrintSql } from "./query-builder-print-sql"
import { migrationsGetAll } from "./migrations-get-all"
import { queryBuilderNativeParameters } from "./query-builder-native-parameters"
import { queryBuilderWhereExpression } from "./query-builder-where-expression"
import { columnReadonly } from "./column-readonly"
import { columnWidthZerofill } from "./column-width-zerofill"
import { datasourceSqliteType } from "./datasource-sqlite-type"
import { findOptionsLockModes } from "./find-options-lock-modes"
import { useContainer } from "./use-container"
import { datasourceMysqlConnector } from "./datasource-mysql-connector"
import { datasourceSqliteOptions } from "./datasource-sqlite-options"
import { datasourceMongodb } from "./datasource-mongodb"
import { mongodbStats } from "./mongodb-stats"
import { mongodbTypes } from "./mongodb-types"
import { datasourceMssqlDomain } from "./datasource-mssql-domain"
import { datasourceSap } from "./datasource-sap"
import { datasourceName } from "./datasource-name"
import { columnUnsignedNumeric } from "./column-unsigned-numeric"
import { repositoryAbstract } from "./repository-abstract"
import { relationCount } from "./relation-count"
import { queryBuilderOnConflict } from "./query-builder-on-conflict"
import { queryBuilderOrUpdate } from "./query-builder-or-update"
import { queryRunnerLoadedTablesViews } from "./query-runner-loaded-tables-views"
import { queryBuilderReplacePropertyNames } from "./query-builder-replace-property-names"
import { findOptionsStringSelect } from "./find-options-string-select"
import { findOptionsStringRelations } from "./find-options-string-relations"
import { transformer } from "../transformer"

export const description = "Migrate from v0.3.x to v1.0"

/**
 * Ordered list of v1 transforms. Order matters — connection renames
 * must run first so subsequent transforms see DataSource, not Connection.
 */
const transforms = [
    connectionToDataSource,
    globalFunctions,
    repositoryFindByIds,
    repositoryFindOneById,
    repositoryExist,
    queryBuilderPrintSql,
    migrationsGetAll,
    queryBuilderNativeParameters,
    queryBuilderWhereExpression,
    columnReadonly,
    columnWidthZerofill,
    datasourceSqliteType,
    findOptionsLockModes,
    useContainer,
    datasourceMysqlConnector,
    datasourceSqliteOptions,
    datasourceMongodb,
    mongodbStats,
    mongodbTypes,
    datasourceMssqlDomain,
    datasourceSap,
    datasourceName,
    columnUnsignedNumeric,
    repositoryAbstract,
    relationCount,
    queryBuilderOnConflict,
    queryBuilderOrUpdate,
    queryRunnerLoadedTablesViews,
    queryBuilderReplacePropertyNames,
    findOptionsStringSelect,
    findOptionsStringRelations,
]

export default transformer(transforms)
