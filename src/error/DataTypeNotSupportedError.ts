import type { ColumnType } from "../driver/types/ColumnTypes"
import type { DatabaseType } from "../driver/types/DatabaseType"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import { TypeORMError } from "./TypeORMError"

export class DataTypeNotSupportedError extends TypeORMError {
    constructor(
        column: ColumnMetadata,
        dataType: ColumnType,
        database?: DatabaseType,
    ) {
        super()

        const type =
            typeof dataType === "string" ? dataType : (<any>dataType).name
        this.message = `Data type "${type}" in "${column.entityMetadata.targetName}.${column.propertyName}" is not supported by "${database}" database.`
    }
}
