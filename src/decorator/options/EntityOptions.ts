import {OrderByCondition} from "../../find-options/OrderByCondition";

/**
 * Describes all entity's options.
 */
export interface EntityOptions {

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    readonly orderBy?: OrderByCondition|((object: any) => OrderByCondition|any);

    /**
     * Table's database engine type (like "InnoDB", "MyISAM", etc).
     * It is used only during table creation.
     * If you update this value and table is already created, it will not change table's engine type.
     * Note that not all databases support this option.
     */
    readonly engine?: string;

    /**
     * Specifies if this table will be skipped during schema synchronization.
     */
    readonly skipSchemaSync?: boolean;

}
