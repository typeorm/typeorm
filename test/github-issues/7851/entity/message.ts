import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "../../../../src"
import { User } from "./user"

@Entity("Message")
export class Message {
    @PrimaryColumn({ type: "varbinary", length: 16 })
    id!: Buffer

    @ManyToOne(() => User, (user) => user.id, { nullable: false })
    @JoinColumn({ referencedColumnName: "id" })
    sender!: User
}
