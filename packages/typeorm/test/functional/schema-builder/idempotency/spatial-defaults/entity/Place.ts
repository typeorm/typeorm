import {
    Column,
    Entity,
    Geography,
    Geometry,
    Point,
    PrimaryGeneratedColumn,
} from "../../../../../../src"

@Entity()
export class Place {
    @PrimaryGeneratedColumn()
    id: number

    @Column("geometry", { nullable: true })
    shape: Geometry

    @Column("geometry", { nullable: true, spatialFeatureType: "Point" })
    pointWithoutSrid: Point

    @Column("geography", { nullable: true })
    area: Geography
}
