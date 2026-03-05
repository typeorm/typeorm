import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Exclusion,
} from "../../../../src"

@Entity()
@Exclusion(`USING gist (int4range("start", "end") WITH &&)`, {
    deferrable: "INITIALLY IMMEDIATE",
})
export class Schedule {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    start: number

    @Column()
    end: number
}
