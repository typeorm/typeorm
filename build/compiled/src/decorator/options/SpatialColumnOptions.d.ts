/**
 * Options for spatial columns.
 */
export interface SpatialColumnOptions {
    /**
     * Column type's feature type.
     * Geometry, Point, Polygon, etc.
     */
    spatialFeatureType?: string;
    /**
     * Column type's SRID.
     * Spatial Reference ID or EPSG code.
     */
    srid?: number;
}
