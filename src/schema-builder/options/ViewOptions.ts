import {Connection, SelectQueryBuilder} from "../..";

/**
 * View options.
 */
export interface ViewOptions {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * View name.
     */
    name: string;

    /**
     * View expression.
     */
    expression: string|((connection: Connection) => SelectQueryBuilder<any>);

}
