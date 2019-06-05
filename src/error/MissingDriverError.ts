/**
 * Thrown when consumer specifies driver type that does not exist or supported.
 */
export class MissingDriverError extends Error {
    name = "MissingDriverError";

    constructor(driverType: string) {
        super();
        Object.setPrototypeOf(this, MissingDriverError.prototype);
        this.message = `Wrong driver: "${driverType}" given. Supported drivers are: "cordova", "expo", "mariadb", "mongodb", "mssql", "mysql", "oracle", "postgres", "sqlite", "sqljs", "react-native".`;
    }

}