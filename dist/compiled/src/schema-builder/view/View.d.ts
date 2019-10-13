import { Connection, Driver, SelectQueryBuilder } from "../..";
import { EntityMetadata } from "../..";
import { ViewOptions } from "../options/ViewOptions";
/**
 * View in the database represented in this class.
 */
export declare class View {
    /**
     * Contains database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     */
    name: string;
    /**
     * Indicates if view is materialized.
     */
    materialized: boolean;
    /**
     * View definition.
     */
    expression: string | ((connection: Connection) => SelectQueryBuilder<any>);
    constructor(options?: ViewOptions);
    /**
     * Clones this table to a new table with all properties cloned.
     */
    clone(): View;
    /**
     * Creates view from a given entity metadata.
     */
    static create(entityMetadata: EntityMetadata, driver: Driver): View;
}
