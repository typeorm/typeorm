import {Connection, Driver, SelectQueryBuilder} from "../..";
import {EntityMetadata} from "../..";
import {ViewOptions} from "../options/ViewOptions";

/**
 * View in the database represented in this class.
 */
export class View {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Contains database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     */
    name: string;

    /**
     * View definition.
     */
    expression: string|((connection: Connection) => SelectQueryBuilder<any>);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options?: ViewOptions) {
        if (options) {
            this.name = options.name;
            this.expression = options.expression;
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones this table to a new table with all properties cloned.
     */
    clone(): View {
        return new View(<ViewOptions> {
            name: this.name,
            expression: this.expression,
        });
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates view from a given entity metadata.
     */
    static create(entityMetadata: EntityMetadata, driver: Driver): View {
        const options: ViewOptions = {
            name: driver.buildTableName(entityMetadata.tableName, entityMetadata.schema, entityMetadata.database),
            expression: entityMetadata.expression!,
        };

        return new View(options);
    }

}
