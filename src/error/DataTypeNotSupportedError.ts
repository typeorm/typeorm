import {ColumnType} from "../driver/types/ColumnTypes";
import {DatabaseType} from "../driver/types/DatabaseType";

export class DataTypeNotSupportedError extends Error {
    name = "DataTypeNotSupportedError";

    constructor(dataType: ColumnType, database?: DatabaseType) {
        super();
        const type = typeof dataType === "string" ? dataType : (<any>dataType).name;
        this.message = `Data type "${type}" is not supported in "${database}" database.`;
    }

}