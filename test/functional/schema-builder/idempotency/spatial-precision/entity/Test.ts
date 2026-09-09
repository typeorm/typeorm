import { Column, Entity, Index, PrimaryColumn } from "../../../../../../src"

@Entity()
@Index(["location", "area"], { spatial: true })
export class Test {
    @PrimaryColumn()
    id: number

    @Column({
        type: "geometry",
        srid: 4326,
        spatialFeatureType: "Point",
        precision: 15,
    })
    location: string

    @Column({
        type: "geometry",
        srid: 4326,
        spatialFeatureType: "Polygon",
        precision: 15,
    })
    area: string
}
