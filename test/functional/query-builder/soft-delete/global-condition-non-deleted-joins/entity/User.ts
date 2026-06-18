import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { Conversation } from "./Conversation"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Conversation, (conversation) => conversation.user)
    conversations: Conversation[]
}
