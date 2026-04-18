import * as columnReadonly from "./column-readonly"
import * as columnUnsignedNumeric from "./column-unsigned-numeric"
import * as columnWidthZerofill from "./column-width-zerofill"
import * as connectionManager from "./connection-manager"
import * as connectionToDataSource from "./connection-to-datasource"
import * as datasourceMongodb from "./datasource-mongodb"
import * as datasourceMssql from "./datasource-mssql"
import * as datasourceMysqlConnector from "./datasource-mysql-connector"
import * as datasourceName from "./datasource-name"
import * as datasourceSap from "./datasource-sap"
import * as datasourceSqliteOptions from "./datasource-sqlite-options"
import * as datasourceSqliteType from "./datasource-sqlite-type"
import * as fileLogger from "./file-logger"
import * as findOptionsLockModes from "./find-options-lock-modes"
import * as findOptionsStringRelations from "./find-options-string-relations"
import * as findOptionsStringSelect from "./find-options-string-select"
import * as globalFunctions from "./global-functions"
import * as migrationsGetAll from "./migrations-get-all"
import * as mongodbStats from "./mongodb-stats"
import * as mongodbTypes from "./mongodb-types"
import * as queryBuilderNativeParameters from "./query-builder-native-parameters"
import * as queryBuilderOnConflict from "./query-builder-on-conflict"
import * as queryBuilderOrUpdate from "./query-builder-or-update"
import * as queryBuilderPrintSql from "./query-builder-print-sql"
import * as queryBuilderReplacePropertyNames from "./query-builder-replace-property-names"
import * as queryBuilderWhereExpression from "./query-builder-where-expression"
import * as queryRunnerLoadedTablesViews from "./query-runner-loaded-tables-views"
import * as relationCount from "./relation-count"
import * as repositoryAbstract from "./repository-abstract"
import * as repositoryExist from "./repository-exist"
import * as repositoryFindByIds from "./repository-find-by-ids"
import * as repositoryFindOneById from "./repository-find-one-by-id"
import * as useContainer from "./use-container"
import { transformer } from "../transformer"

export const description = "Migrate from v0.3.x to v1.0"
export const upgradingGuide =
    "https://typeorm.io/docs/releases/1.0/upgrading-from-0.3"

/**
 * Ordered list of v1 transforms. Order matters — connection renames
 * must run first so subsequent transforms see DataSource, not Connection.
 */
export const transforms = [
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
    datasourceMssql,
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
    connectionManager,
    fileLogger,
]

export default transformer(transforms)
