import { TypeORMError } from "./TypeORMError";
export class DataTypeNotSupportedError extends TypeORMError {
    constructor(column, dataType, database) {
        super();
        const type = typeof dataType === "string" ? dataType : dataType.name;
        this.message = `Data type "${type}" in "${column.entityMetadata.targetName}.${column.propertyName}" is not supported by "${database}" database.`;
    }
}

//# sourceMappingURL=DataTypeNotSupportedError.js.map
