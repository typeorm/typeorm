import {
    Column,
    Entity,
    Point,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
export class DimensionalPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column("geometry", {
        nullable: true,
        spatialFeatureType: "PointZ",
        srid: 4326,
    })
    pointZ: Point

    @Column("geometry", {
        nullable: true,
        spatialFeatureType: "PointM",
        srid: 4326,
    })
    pointM: Point

    @Column("geometry", {
        nullable: true,
        spatialFeatureType: "PointZM",
        srid: 4326,
    })
    pointZM: Point

    @Column("geography", {
        nullable: true,
        spatialFeatureType: "PointZ",
        srid: 4326,
    })
    geogZ: Point
}
