import { MissingDriverError } from "../error/MissingDriverError";
import { Driver } from "./Driver";
import { Connection } from "../connection/Connection";

/**
 * Helps to create drivers.
 */
export class DriverFactory {

    /**
     * Creates a new driver depend on a given connection's driver.
     */
    create(connection: Connection): Driver {
        if (connection.options.driver) return new connection.options.driver(connection);
        else throw new MissingDriverError(connection.options.type)
    }

}
