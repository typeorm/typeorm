import { ConnectionOptions } from "../ConnectionOptions";
/**
 * Reads connection options defined in the xml file.
 */
export declare class ConnectionOptionsXmlReader {
    /**
     * Reads connection options from given xml file.
     */
    read(path: string): Promise<ConnectionOptions[]>;
    /**
     * Reads xml file contents and returns them in a promise.
     */
    protected readXml(path: string): Promise<any>;
}
