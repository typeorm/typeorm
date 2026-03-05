import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    Exclusion,
} from "../../../../src"

@Entity()
@Exclusion(`USING gist (int4range("from", "to") WITH &&)`, {
    deferrable: "INITIALLY DEFERRED",
})
export class Booking {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    from: number

    @Column()
    to: number
}
