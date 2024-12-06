import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../src"
import { User } from "./User"

@Entity()
export class DirectConversation {
    @ManyToOne(() => User, {
        nullable: false,
        eager: true,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        filterConditionCascade: true
    })
    @JoinColumn({ name: "user1Id" })
    user1: User

    @ManyToOne(() => User, {
        nullable: false,
        eager: true,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        filterConditionCascade: true
    })
    @JoinColumn({ name: "user2Id" })
    user2: User

    @PrimaryColumn("uuid")
    user1Id: string

    @PrimaryColumn("uuid")
    user2Id: string
}
