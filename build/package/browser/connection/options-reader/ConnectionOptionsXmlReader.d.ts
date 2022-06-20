import { DataSourceOptions } from "../../data-source/DataSourceOptions";
/**
 * Reads connection options defined in the xml file.
 *
 * @deprecated
 */
export declare class ConnectionOptionsXmlReader {
    /**
     * Reads connection options from given xml file.
     */
    read(path: string): Promise<DataSourceOptions[]>;
    /**
     * Reads xml file contents and returns them in a promise.
     */
    protected readXml(path: string): Promise<any>;
}
