import type { TableColumnOptions } from "../options/TableColumnOptions"
import type { ColumnMetadata } from "../../metadata/ColumnMetadata"
import type { Driver } from "../../driver/Driver"

export class TableUtils {
    static createTableColumnOptions(
        columnMetadata: ColumnMetadata,
        driver: Driver,
    ): TableColumnOptions {
        const isUnique = driver.normalizeIsUnique(columnMetadata)
        return {
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
            isUnique,
            uniqueConstraintName: isUnique
                ? TableUtils.findUniqueConstraintName(columnMetadata)
                : undefined,
            isArray: columnMetadata.isArray || false,
            enum: columnMetadata.enum
                ? columnMetadata.enum.map((val) => val + "")
                : columnMetadata.enum,
            enumName: columnMetadata.enumName,
            primaryKeyConstraintName: columnMetadata.primaryKeyConstraintName,
            spatialFeatureType: columnMetadata.spatialFeatureType,
            srid: columnMetadata.srid,
        }
    }

    /**
     * Finds the name of the unique constraint, or of the unique index for
     * drivers that implement unique constraints as unique indices, that
     * covers only the given column.
     *
     * @param columnMetadata
     */
    protected static findUniqueConstraintName(
        columnMetadata: ColumnMetadata,
    ): string | undefined {
        const { uniques, indices } = columnMetadata.entityMetadata
        const unique = uniques.find(
            (unique) =>
                unique.columns.length === 1 &&
                unique.columns[0] === columnMetadata,
        )
        if (unique) return unique.name

        const uniqueIndex = indices.find(
            (index) =>
                index.isUnique &&
                index.columns.length === 1 &&
                index.columns[0] === columnMetadata,
        )
        return uniqueIndex?.name
    }
}
