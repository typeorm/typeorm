import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

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
     * (optional) driver module package name
     */
    readonly driverModule?: string;

}