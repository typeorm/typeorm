import { DataSourceOptions } from "../../data-source/DataSourceOptions";
/**
 * Reads connection options defined in the yml file.
 *
 * @deprecated
 */
export declare class ConnectionOptionsYmlReader {
    /**
     * Reads connection options from given yml file.
     */
    read(path: string): Promise<DataSourceOptions[]>;
}
