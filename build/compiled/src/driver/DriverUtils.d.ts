import { Driver } from "./Driver";
/**
 * Common driver utility functions.
 */
export declare class DriverUtils {
    /**
     * Normalizes and builds a new driver options.
     * Extracts settings from connection url and sets to a new options object.
     */
    static buildDriverOptions(options: any, buildOptions?: {
        useSid: boolean;
    }): any;
    /**
     * buildDriverOptions for MongodDB only to support replica set
     */
    static buildMongoDBDriverOptions(options: any, buildOptions?: {
        useSid: boolean;
    }): any;
    /**
     * Builds column alias from given alias name and column name.
     *
     * If alias length is greater than the limit (if any) allowed by the current
     * driver, replaces it with a hashed string.
     *
     * @param driver Current `Driver`.
     * @param alias Alias part.
     * @param column Name of the column to be concatened to `alias`.
     *
     * @return An alias allowing to select/transform the target `column`.
     */
    static buildColumnAlias({ maxAliasLength }: Driver, alias: string, column: string): string;
    /**
     * Extracts connection data from the connection url.
     */
    private static parseConnectionUrl;
    /**
     * Extracts connection data from the connection url for MongoDB to support replica set.
     */
    private static parseMongoDBConnectionUrl;
}
