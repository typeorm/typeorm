import { ColumnType } from "../driver/types/ColumnTypes";
import { DatabaseType } from "../driver/types/DatabaseType";
import { ColumnMetadata } from "../metadata/ColumnMetadata";
export declare class DataTypeNotSupportedError extends Error {
    name: string;
    constructor(column: ColumnMetadata, dataType: ColumnType, database?: DatabaseType);
}
