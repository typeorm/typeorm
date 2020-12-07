import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

export interface IgniteConnectionOptions extends BaseConnectionOptions {
    readonly type: "ignite";

    /**
     * @example
     * 127.0.0.1:10800
     */
    readonly endpoint: string | string[];
    /**
     * ignite schema name
     */
    readonly schema: string;

    readonly username?: string;

    readonly password?: string;

    /**
     * whether to reconnect on connection disconnected
     * @default true
     */
    readonly autoReconnect?: boolean;
    /**
     * re-connection reties count
     * @default 10
     */
    readonly reconnectReties?: number;

    /**
     * re-connection retry delay in milliseconds
     * @default 1000
     */
    readonly reconnectDelay?: number;
}
