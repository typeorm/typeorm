import { MissingDriverError } from "../error/MissingDriverError"
import { Driver } from "./Driver"
import { DataSource } from "../data-source/DataSource"

/**
 * Helps to create drivers.
 */
export class DriverFactory {
    private static readonly availableDrivers = [
        "aurora-mysql",
        "aurora-postgres",
        "better-sqlite3",
        "capacitor",
        "cockroachdb",
        "cordova",
        "expo",
        "mariadb",
        "mongodb",
        "mssql",
        "mysql",
        "nativescript",
        "oracle",
        "postgres",
        "react-native",
        "sap",
        "sqlite",
        "sqljs",
        "spanner",
    ]

    /**
     * Creates a new driver depend on a given connection's driver type.
     * @param connection DataSource instance.
     * @returns Driver
     */
    async create(connection: DataSource): Promise<Driver> {
        const driverPattern = /^[a-z]+(\-[a-z]+)*$/
        let driverType: string = connection.options.type
        if (driverType === "mariadb") {
            driverType = "mysql"
        } else if (driverType === "mssql") {
            driverType = "sql-server"
        }

        // This validation avoids access to code out of driver dir
        if (!driverPattern.test(driverType)) {
            throw new MissingDriverError(driverType, DriverFactory.availableDrivers)
        }        

        try {
            const driverName = this.getDriverName(driverType)
            const module = await import(`./${driverType}/${driverName}`)
            const Driver = module[driverName]
            return new Driver(connection)
        } catch (err) {
            if (err.code === "ERR_MODULE_NOT_FOUND") {
                throw new MissingDriverError(driverType, DriverFactory.availableDrivers)
            }

            throw err
        }
    }

    /**
     * Calculates the driver name from a given driver type
     * @param driverType Driver type used to calculate driver name
     */
    private getDriverName(driverType: string): string {
        // Convert the kebab-case to PascalCase
        const pascalDriverName = driverType.split("-").reduce((carry, item) => {
            return (
                carry +
                item.charAt(0).toUpperCase() +
                item.slice(1).toLowerCase()
            )
        }, "")

        return `${pascalDriverName}Driver`
    }
}
