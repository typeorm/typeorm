import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Exclusion,
} from "../../../../src"

@Entity()
@Exclusion(`USING gist (tstzrange("start","end") WITH &&)`, {
    deferrable: "INITIALLY IMMEDIATE",
})
export class Schedule {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    start: Date

    @Column()
    end: Date
}
