import ymlParser from 'js-yaml';
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
    async read(path: string): Promise<ConnectionOptions[]> {
        const contentsBuffer = PlatformTools.readFileSync(path);
        const contents = contentsBuffer.toString();

        const config: undefined | string | {[key: string]: any} = ymlParser.safeLoad(contents);

        if (typeof config !== 'object') {
            return [];
        }

        return Object.keys(config).map(connectionName => {
            return Object.assign({ name: connectionName }, config[connectionName]);
        });
    }

}
