import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    Exclusion,
} from "../../../../src"

@Entity()
@Exclusion(`USING gist (tstzrange("from", "to") WITH &&)`, {
    deferrable: "INITIALLY DEFERRED",
})
export class Booking {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "timestamptz" })
    from: Date

    @Column({ type: "timestamptz" })
    to: Date
}
