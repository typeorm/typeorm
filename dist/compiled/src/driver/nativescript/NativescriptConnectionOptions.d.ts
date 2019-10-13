import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";
/**
 * NativeScript-specific connection options.
 */
export interface NativescriptConnectionOptions extends BaseConnectionOptions {
    /**
     * Database type.
     */
    readonly type: "nativescript";
    /**
     * Database name.
     */
    readonly database: string;
    /**
     * The driver object
     * you should pass `require('nativescript-sqlite') here
     */
    readonly driver: any;
}
