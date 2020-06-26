import { BaseConnectionOptions } from "@typeorm/core";

/**
 * Sqlite-specific connection options.
 */
export interface ReactNativeConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "react-native";

    /**
     * Database name.
     */
    readonly database: string;

    /**
     * Storage Location
     */
    readonly location: string;
}
