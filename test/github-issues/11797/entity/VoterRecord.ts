import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    Index,
} from "../../../../src"
import { VoterFileSnapshot } from "./VoterFileSnapshot"

@Entity()
@Index("records_by_snapshot", ["fileSnapshot.id", "stateVoterId"], {
    unique: true,
})
export class VoterRecord {
    @PrimaryGeneratedColumn()
    readonly id: number

    @Column()
    stateVoterId: string

    @Column()
    name: string

    @ManyToOne(() => VoterFileSnapshot, (snapshot) => snapshot.voterRecords, {
        nullable: false,
    })
    fileSnapshot?: VoterFileSnapshot
}
