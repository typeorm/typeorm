import {BaseClearOptions} from "../BaseClearOptions";

/**
 * Postgres-specific connection options.
 */
export interface PostgresClearOptions extends BaseClearOptions {

    /**
     * Database type.
     */
    readonly type: "postgres";

    /**
     * Cascade when truncating.
     */
    readonly cascade?: boolean;
}
