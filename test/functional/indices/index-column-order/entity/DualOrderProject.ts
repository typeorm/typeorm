import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
@Index([{ field: "score", order: "ASC" }])
@Index([{ field: "score", order: "DESC" }])
export class DualOrderProject {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    score: number
}
