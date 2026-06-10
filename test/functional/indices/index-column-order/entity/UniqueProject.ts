import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
} from "../../../../../src"

@Entity()
@Unique("uniq_unique_project_3336", [
    { field: "semesterYear", order: "DESC" },
    "semesterSeason",
])
export class UniqueProject {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    semesterYear: number

    @Column()
    semesterSeason: string
}
