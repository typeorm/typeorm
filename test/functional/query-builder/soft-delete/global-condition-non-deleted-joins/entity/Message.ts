import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { Conversation } from "./Conversation"

@Entity()
export class Message {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string

    @ManyToOne(() => Conversation, (conversation) => conversation.messages)
    conversation: Conversation
}
