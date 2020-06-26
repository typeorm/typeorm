import { ConnectionOptions } from "@typeorm/browser-core";
import { readFileSync } from 'fs';
import { safeLoad } from 'js-yaml';

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
        const config = safeLoad(readFileSync(path).toString());
        return Object.keys(config).map(connectionName => {
            return Object.assign({name: connectionName}, config[connectionName]);
        });
    }

}
