"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingDriverError = void 0;
/**
 * Thrown when consumer specifies driver type that does not exist or supported.
 */
class MissingDriverError extends Error {
    constructor(driverType) {
        super();
        this.name = "MissingDriverError";
        Object.setPrototypeOf(this, MissingDriverError.prototype);
        this.message = `Wrong driver: "${driverType}" given. Supported drivers are: "cordova", "expo", "mariadb", "mongodb", "mssql", "mysql", "oracle", "postgres", "sqlite", "better-sqlite3", "sqljs", "react-native", "aurora-data-api", "aurora-data-api-pg".`;
    }
}
exports.MissingDriverError = MissingDriverError;

//# sourceMappingURL=MissingDriverError.js.map
