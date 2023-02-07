import { Column, Entity, Index, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
@Index(["token"], { unique: false })
@Index(["created"], { unique: false })
export class PushLog {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    token: string

    @Column()
    os: string

    @Column("text")
    payload: string

    @Column("text")
    response: string

    @Column()
    success: boolean

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created: Date
}
