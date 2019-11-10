import {DatabaseType} from "./types/DatabaseType";

/**
 * BaseClearOptions is set of options shared by all database types.
 */
export interface BaseClearOptions {

    /**
     * Database type. This value is required.
     */
    readonly type: DatabaseType;
}
