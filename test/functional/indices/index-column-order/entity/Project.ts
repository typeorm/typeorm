import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
@Index("idx_project_3336", [
    { field: "semesterYear", order: "DESC" },
    { field: "semesterSeason", order: "ASC" },
    "id",
])
export class Project {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    semesterYear: number

    @Column()
    semesterSeason: string

    @Index("idx_project_3336_col", { order: "DESC" })
    @Column()
    score: number
}
