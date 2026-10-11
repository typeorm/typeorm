import type { TableColumnOptions } from "../options/TableColumnOptions"
import type { ColumnMetadata } from "../../metadata/ColumnMetadata"
import type { Driver } from "../../driver/Driver"
import { TypeORMError } from "../../error/TypeORMError"
import { mysqlTimestampPrecision } from "../../util/MysqlTimestampPrecision"

export class TableUtils {
    static createTableColumnOptions(
        columnMetadata: ColumnMetadata,
        driver: Driver,
    ): TableColumnOptions {
        const logicalColumn = columnMetadata
        columnMetadata = columnMetadata.resolveDriverColumn(driver)
        const options: TableColumnOptions = {
            name: columnMetadata.databaseName,
            length: driver.getColumnLength(columnMetadata),
            charset: columnMetadata.charset,
            collation: columnMetadata.collation,
            precision: columnMetadata.precision,
            scale: columnMetadata.scale,
            unsigned: columnMetadata.unsigned,
            asExpression: columnMetadata.asExpression,
            generatedType: columnMetadata.generatedType,
            default: driver.normalizeDefault(columnMetadata),
            onUpdate: columnMetadata.onUpdate,
            comment: columnMetadata.comment,
            isGenerated: columnMetadata.isGenerated,
            generationStrategy: columnMetadata.generationStrategy,
            generatedIdentity: columnMetadata.generatedIdentity,
            isNullable: columnMetadata.isNullable,
            type: driver.normalizeType(columnMetadata),
            isPrimary: columnMetadata.isPrimary,
            isUnique: driver.normalizeIsUnique(columnMetadata),
            isArray: columnMetadata.isArray || false,
            enum: columnMetadata.enum
                ? columnMetadata.enum.map((val) => val + "")
                : columnMetadata.enum,
            enumName: columnMetadata.enumName,
            primaryKeyConstraintName: columnMetadata.primaryKeyConstraintName,
            spatialFeatureType: columnMetadata.spatialFeatureType,
            srid: columnMetadata.srid,
        }
        if (
            columnMetadata !== logicalColumn &&
            (driver.options.type === "mysql" ||
                driver.options.type === "aurora-mysql") &&
            (options.type === "datetime" || options.type === "timestamp") &&
            typeof options.default === "string"
        ) {
            // Reuse the already-normalized result: default factories must not
            // run a second time merely to validate the physical declaration.
            const defaultPrecision = mysqlTimestampPrecision(options.default)
            const precision = options.precision ?? 0
            if (
                defaultPrecision !== undefined &&
                defaultPrecision !== precision
            )
                throw new TypeORMError(
                    `Column "${columnMetadata.propertyName}" has an incompatible dialectTypes override for "${driver.options.type}": DEFAULT CURRENT_TIMESTAMP precision must match the physical column precision (${precision}).`,
                )
        }
        return options
    }
}
