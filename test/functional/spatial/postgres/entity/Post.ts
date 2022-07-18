import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { Index } from "typeorm/decorator/Index"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("geometry", {
        nullable: true,
    })
    @Index({
        spatial: true,
    })
    geom: object

    @Column("geometry", {
        nullable: true,
        spatialFeatureType: "Point",
    })
    pointWithoutSRID: object

    @Column("geometry", {
        nullable: true,
        spatialFeatureType: "Point",
        srid: 4326,
    })
    point: object

    @Column("geography", {
        nullable: true,
    })
    geog: object
}
