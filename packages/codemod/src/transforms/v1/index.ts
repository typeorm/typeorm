import type { API, FileInfo } from "jscodeshift"

import { renameConnectionToDataSource } from "./rename-connection-to-datasource"
import { replaceGlobalFunctions } from "./replace-global-functions"
import { renameFindByIds } from "./rename-find-by-ids"
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

export const description = "Migrate from v0.3.x to v1.0"

/**
 * Ordered list of v1 transforms. Order matters — connection renames
 * must run first so subsequent transforms see DataSource, not Connection.
 */
export const transforms = [
    renameConnectionToDataSource,
    replaceGlobalFunctions,
    renameFindByIds,
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
]

/**
 * Composite transform that runs all v1 transforms in sequence.
 * This is the entry point used by jscodeshift when running all transforms.
 */
const transformer = (file: FileInfo, api: API): string | undefined => {
    let source = file.source
    let hasChanges = false

    for (const transform of transforms) {
        const result = transform({ ...file, source }, api)

        if (result !== undefined) {
            source = result
            hasChanges = true
        }
    }

    return hasChanges ? source : undefined
}

export default transformer
