import { renameConnectionToDataSource } from "./rename-connection-to-datasource"
import { replaceGlobalFunctions } from "./replace-global-functions"
import { renameFindByIds } from "./rename-find-by-ids"
import { renameFindOneById } from "./rename-find-one-by-id"
import { renameExistToExists } from "./rename-exist-to-exists"
import { renamePrintSqlToLogQuery } from "./rename-print-sql-to-log-query"
import { renameGetAllMigrations } from "./rename-get-all-migrations"
import { replaceSetNativeParameters } from "./replace-set-native-parameters"
import { replaceWhereExpressionType } from "./replace-where-expression-type"
import { replaceReadonlyColumn } from "./replace-readonly-column"
import { removeWidthZerofill } from "./remove-width-zerofill"
import { replaceSqliteType } from "./replace-sqlite-type"
import { replaceLockModes } from "./replace-lock-modes"
import { removeUseContainer } from "./remove-use-container"
import { removeConnectorPackage } from "./remove-connector-package"
import { replaceSqliteOptions } from "./replace-sqlite-options"
import { removeMongodbOptions } from "./remove-mongodb-options"
import { replaceMongodbStats } from "./replace-mongodb-stats"
import { replaceMongodbTypes } from "./replace-mongodb-types"
import { replaceMssqlDomain } from "./replace-mssql-domain"
import { removeSapOptions } from "./remove-sap-options"
import { removeDatasourceName } from "./remove-datasource-name"
import { removeUnsignedNumeric } from "./remove-unsigned-numeric"
import { removeAbstractRepository } from "./remove-abstract-repository"
import { removeRelationCount } from "./remove-relation-count"
import { replaceOnConflict } from "./replace-on-conflict"
import { renameOrUpdateOverload } from "./rename-or-update-overload"
import { renameLoadedTablesViews } from "./rename-loaded-tables-views"
import { removeReplacePropertyNames } from "./remove-replace-property-names"
import { replaceStringSelect } from "./replace-string-select"
import { replaceStringRelations } from "./replace-string-relations"
import { transformer } from "../transformer"

export const description = "Migrate from v0.3.x to v1.0"

/**
 * Ordered list of v1 transforms. Order matters — connection renames
 * must run first so subsequent transforms see DataSource, not Connection.
 */
const transforms = [
    renameConnectionToDataSource,
    replaceGlobalFunctions,
    renameFindByIds,
    renameFindOneById,
    renameExistToExists,
    renamePrintSqlToLogQuery,
    renameGetAllMigrations,
    replaceSetNativeParameters,
    replaceWhereExpressionType,
    replaceReadonlyColumn,
    removeWidthZerofill,
    replaceSqliteType,
    replaceLockModes,
    removeUseContainer,
    removeConnectorPackage,
    replaceSqliteOptions,
    removeMongodbOptions,
    replaceMongodbStats,
    replaceMongodbTypes,
    replaceMssqlDomain,
    removeSapOptions,
    removeDatasourceName,
    removeUnsignedNumeric,
    removeAbstractRepository,
    removeRelationCount,
    replaceOnConflict,
    renameOrUpdateOverload,
    renameLoadedTablesViews,
    removeReplacePropertyNames,
    replaceStringSelect,
    replaceStringRelations,
]

export default transformer(transforms)
