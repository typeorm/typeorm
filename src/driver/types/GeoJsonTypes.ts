/**
 * Position object.
 * https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.1
 */
export type Position = number[]

/**
 * Point geometry object.
 * https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.2
 */
export type Point = {
    type: "Point"
    coordinates: Position
}

/**
 * LineString geometry object.
 * https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.4
 */
export type LineString = {
    type: "LineString"
    coordinates: Position[]
}

/**
 * Polygon geometry object.
 * https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6
 */
export type Polygon = {
    type: "Polygon"
    coordinates: Position[][]
}

/**
 * MultiPoint geometry object.
 *  https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.3
 */
export type MultiPoint = {
    type: "MultiPoint"
    coordinates: Position[]
}

/**
 * MultiLineString geometry object.
 * https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.5
 */
export type MultiLineString = {
    type: "MultiLineString"
    coordinates: Position[][]
}

/**
 * MultiPolygon geometry object.
 * https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.7
 */
export type MultiPolygon = {
    type: "MultiPolygon"
    coordinates: Position[][][]
}

/**
 * Geometry Collection
 * https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.8
 */
export type GeometryCollection = {
    type: "GeometryCollection"
    geometries: (
        | Point
        | LineString
        | Polygon
        | MultiPoint
        | MultiLineString
        | MultiPolygon
    )[]
}

/**
 * Union of Geometry objects.
 */
export type Geometry =
    | Point
    | LineString
    | Polygon
    | MultiPoint
    | MultiLineString
    | MultiPolygon
    | GeometryCollection
export type Geography = Geometry

/**
 * A feature object which contains a geometry and associated properties.
 * https://datatracker.ietf.org/doc/html/rfc7946#section-3.2
 */
export type Feature = {
    type: "Feature"
    geometry: Geometry
    id?: string | number
    bbox?: number[]
    properties: { [name: string]: any } | null
}

/**
 * A collection of feature objects.
 *  https://datatracker.ietf.org/doc/html/rfc7946#section-3.3
 */
export type FeatureCollection = {
    type: "FeatureCollection"
    bbox?: number[]
    features: Feature[]
}

/**
 * Union of GeoJSON objects.
 */
export type GeoJSON = Geometry | Feature | FeatureCollection
