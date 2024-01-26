import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity({ name: "Session" })
export class Session {
    @PrimaryGeneratedColumn()
    id?: number

    @Column({
        type: "timestamp",
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
        onUpdate: "CURRENT_TIMESTAMP(3)",
    })
    ts: Date
}
