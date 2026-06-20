import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
} from "../../../../../src"

@Entity()
export class UniqueProjectPropertyLevel {
    @PrimaryGeneratedColumn()
    id: number

    @Unique("uq_property_level_3336", { order: "DESC" })
    @Column()
    score: number
}
