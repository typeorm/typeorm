import { Driver } from "./Driver";
import { Connection } from "../connection/Connection";
/**
 * Helps to create drivers.
 */
export declare class DriverFactory {
    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    create(connection: Connection): Driver;
}
