import {TableColumnOptions} from "../options/TableColumnOptions";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Driver} from "../../driver/Driver";

export class TableUtils {

    static createTableColumnOptions(columnMetadata: ColumnMetadata, driver: Driver): TableColumnOptions {
        return {
            name: columnMetadata.databaseName,
            length: driver.getColumnLength(columnMetadata),
            charset: columnMetadata.charset,
            collation: columnMetadata.collation,
            precision: columnMetadata.precision,
            scale: columnMetadata.scale,
            default: driver.normalizeDefault(columnMetadata.default),
            comment: columnMetadata.comment,
            isGenerated: columnMetadata.isGenerated,
            generationStrategy: columnMetadata.generationStrategy,
            isNullable: columnMetadata.isNullable,
            type: driver.normalizeType(columnMetadata),
            isPrimary: columnMetadata.isPrimary,
            isUnique: columnMetadata.isUnique,
            isArray: columnMetadata.isArray || false,
            enum: columnMetadata.enum
        };
    }

}