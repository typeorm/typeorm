import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Sql.js-specific connection options.
 */
export interface SqljsConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "sqljs";

    /**
     * A Uint8Array that gets imported when the connection is opened.
     */
    readonly database?: Uint8Array;

    /**
     * Enables the autoSave mechanism which either saves to location
     * or calls autoSaveCallback every time a change to the database is made.
     */
    readonly autoSave?: boolean;

    /**
     * A function that gets called on every change instead of the internal autoSave function.
     * autoSave has to be enabled for this to work.
     */
    readonly autoSaveCallback?: Function;

    /**
     * File path (Node.js) or local storage key (browser) to load and save database from.
     * If this is specified without autoSave, the database is loaded from the location
     * and can be saved manually via the SqljsEntityManager. If autoSave is enabled,
     * location is used to automatically save the database.
     */
    readonly location?: string;
}
