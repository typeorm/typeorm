import { ConnectionOptions } from "../ConnectionOptions";
/**
 * Reads connection options defined in the yml file.
 */
export declare class ConnectionOptionsYmlReader {
    /**
     * Reads connection options from given yml file.
     */
    read(path: string): ConnectionOptions[];
}
