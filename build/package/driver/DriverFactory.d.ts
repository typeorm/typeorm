import { Driver } from "./Driver";
import { DataSource } from "../data-source/DataSource";
/**
 * Helps to create drivers.
 */
export declare class DriverFactory {
    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    create(connection: DataSource): Driver;
}
