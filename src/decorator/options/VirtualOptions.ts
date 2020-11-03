import { ColumnType, ValueTransformer } from '../..';

/**
 * Describes all virtual column's options.
 */
export class VirtualOptions {
    /**
     * Column type. Must be one of the value from the ColumnTypes class.
     */
    type?: ColumnType;

    /**
     * Array of possible enumerated values.
     */
    enum?: (string|number)[]|Object;
    /**
     * Exact name of enum
     */
    enumName?: string;

    /**
     * Return type of HSTORE column.
     * Returns value as string or as object.
     */
    hstoreType?: "object"|"string";

    /**
     * Indicates if this column is an array.
     * Can be simply set to true or array length can be specified.
     * Supported only by postgres.
     */
    array?: boolean;

    /**
     * Specifies a value transformer that is to be used to (un)marshal
     * this column when reading or writing to the database.
     */
    transformer?: ValueTransformer|ValueTransformer[];

    /**
     * Spatial Feature Type (Geometry, Point, Polygon, etc.)
     */
    spatialFeatureType?: string;

    /**
     * SRID (Spatial Reference ID (EPSG code))
     */
    srid?: number;
}
