import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { DeleteDateColumn } from "../../../../../../src/decorator/columns/DeleteDateColumn"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { User } from "./User"
import { Message } from "./Message"

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => User, (user) => user.conversations)
    user: User

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[]

    @DeleteDateColumn()
    deletedAt: Date
}
