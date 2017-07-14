import {TableType} from "../metadata/types/TableTypes";
import {OrderByCondition} from "../find-options/OrderByCondition";

/**
 * Arguments for TableMetadata class, helps to construct an TableMetadata object.
 */
export interface TableMetadataArgs {

    /**
     * Class to which table is applied.
     * Function target is a table defined in the class.
     * String target is a table defined in a json schema.
     */
    target: Function|string;

    /**
     * Table's name. If name is not set then table's name will be generated from target's name.
     */
    name?: string;

    /**
     * Table type. Tables can be abstract, closure, junction, embedded, etc.
     */
    type: TableType;

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    orderBy?: OrderByCondition|((object: any) => OrderByCondition|any);

    /**
     * Table's database engine type (like "InnoDB", "MyISAM", etc).
     */
    engine?: string;

    /**
     * Whether table must be synced during schema build or not
     */
    skipSync?: boolean;

}
