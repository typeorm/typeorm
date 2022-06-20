import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions";
/**
 * Sqlite-specific connection options.
 */
export interface CordovaConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "cordova";
    /**
     * Database name.
     */
    readonly database: string;
    /**
     * The driver object
     * This defaults to `window.sqlitePlugin`
     */
    readonly driver?: any;
    /**
     * Storage Location
     */
    readonly location: string;
}
