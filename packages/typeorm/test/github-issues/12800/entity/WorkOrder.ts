import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class WorkOrder {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "geometry",
        srid: 4326,
        spatialFeatureType: "Geometry",
        precision: 15,
        nullable: true,
    })
    geometry: string
}
