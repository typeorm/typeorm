import type { Geometry } from "../../driver/types/GeoJsonTypes"

/**
 * Options for spatial columns.
 */
export interface SpatialColumnOptions {
    /**
     * Column type's feature type.
     * Geometry, Point, Polygon, etc., optionally with a Z, M or ZM
     * dimensional suffix, such as PointZ or GeometryZM.
     */
    spatialFeatureType?:
        | Geometry["type"]
        | "Geometry"
        | `${Geometry["type"] | "Geometry"}${"Z" | "M" | "ZM"}`

    /**
     * Column type's SRID.
     * Spatial Reference ID or EPSG code.
     */
    srid?: number
}
