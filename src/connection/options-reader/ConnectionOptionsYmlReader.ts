import * as fs from "fs";
import {PlatformTools} from "../../platform/PlatformTools";
import {ConnectionOptions} from "../ConnectionOptions";

/**
 * Reads connection options defined in the yml file.
 */
export class ConnectionOptionsYmlReader {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Reads connection options from given yml file.
     */
    read(path: string): ConnectionOptions[] {
        const ymlParser = PlatformTools.load("js-yaml");
        const config = ymlParser.safeLoad(fs.readFileSync(path));
        return Object.keys(config).map(connectionName => {
            return Object.assign({ name: connectionName }, config[connectionName]);
        });
    }

}