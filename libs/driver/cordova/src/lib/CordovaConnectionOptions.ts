import {BaseConnectionOptions} from "@typeorm/browser-core";

/**
 * Sqlite-specific connection options.
 */
export interface CordovaConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "cordova";

    /**
     * Database name.
     */
    readonly database: string;

    /**
     * Storage Location
     */
    readonly location: string;
}
