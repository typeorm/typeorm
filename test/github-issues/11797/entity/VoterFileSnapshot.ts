import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../src"
import { VoterRecord } from "./VoterRecord"

@Entity()
export class VoterFileSnapshot {
    @PrimaryGeneratedColumn()
    readonly id: number

    @Column()
    status: string

    @OneToMany(() => VoterRecord, (record) => record.fileSnapshot)
    voterRecords?: VoterRecord[]
}
