/**
 * Thrown when consumer specifies driver type that does not exist or supported.
 */
export class MissingDriverError extends Error {
    constructor(driverType) {
        super();
        this.name = "MissingDriverError";
        Object.setPrototypeOf(this, MissingDriverError.prototype);
        this.message = `Wrong driver: "${driverType}" given. Supported drivers are: "cordova", "expo", "mariadb", "mongodb", "mssql", "mysql", "oracle", "postgres", "sqlite", "better-sqlite3", "sqljs", "react-native", "aurora-data-api", "aurora-data-api-pg".`;
    }
}

//# sourceMappingURL=MissingDriverError.js.map
