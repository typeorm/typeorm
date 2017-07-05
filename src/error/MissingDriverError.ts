/**
 * Thrown when consumer specifies driver type that does not exist or supported.
 */
export class MissingDriverError extends Error {
    name = "MissingDriverError";

    constructor(driverType: string) {
        super();
        this.message = `Wrong driver ${driverType} given. Supported drivers are: "mysql", "postgres", "mssql", "oracle", "mariadb", "sqlite".`;
        this.stack = new Error().stack;
    }

}