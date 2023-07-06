"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTypeNotSupportedError = void 0;
class DataTypeNotSupportedError extends Error {
    constructor(column, dataType, database) {
        super();
        this.name = "DataTypeNotSupportedError";
        Object.setPrototypeOf(this, DataTypeNotSupportedError.prototype);
        const type = typeof dataType === "string" ? dataType : dataType.name;
        this.message = `Data type "${type}" in "${column.entityMetadata.targetName}.${column.propertyName}" is not supported by "${database}" database.`;
    }
}
exports.DataTypeNotSupportedError = DataTypeNotSupportedError;
//# sourceMappingURL=DataTypeNotSupportedError.js.map