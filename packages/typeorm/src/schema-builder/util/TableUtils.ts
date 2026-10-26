import type { TableColumnOptions } from "../options/TableColumnOptions"
import type { ColumnMetadata } from "../../metadata/ColumnMetadata"
import type { IndexMetadata } from "../../metadata/IndexMetadata"
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
     * The query runners create a plain unique constraint or index for a
     * column that is marked unique. A unique index with further properties
     * (for example a NULL_FILTERED index in Spanner) cannot be created that
     * way, so its name is not returned and the schema builder keeps creating
     * it through the regular index synchronization.
     *
     * @param columnMetadata the column to find the unique constraint for
     * @returns the constraint or index name, or undefined if there is none
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
        if (uniqueIndex && TableUtils.isPlainUniqueIndex(uniqueIndex))
            return uniqueIndex.name

        return undefined
    }

    /**
     * Checks whether the given unique index has no properties beyond its
     * uniqueness, so that a unique index created for a column marked as
     * unique is identical to it.
     *
     * @param index the unique index to check
     * @returns true if the index is a plain unique index
     */
    protected static isPlainUniqueIndex(index: IndexMetadata): boolean {
        return (
            !index.isNullFiltered &&
            !index.isSpatial &&
            !index.isFulltext &&
            !index.isConcurrent &&
            !index.where &&
            !index.parser &&
            !index.type
        )
    }
}
