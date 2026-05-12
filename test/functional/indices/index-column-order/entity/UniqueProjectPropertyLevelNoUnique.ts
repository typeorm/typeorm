import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

/** Same table as UniqueProjectPropertyLevel but without the unique constraint. */
@Entity("unique_project_property_level")
export class UniqueProjectPropertyLevelNoUnique {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    score: number
}
