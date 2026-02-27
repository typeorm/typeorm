import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
    RelationId,
} from "../../../../../../src"
import { User } from "./User"

@Entity()
export class Group {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany(() => User)
    @JoinTable()
    members: User[]

    @RelationId((group: Group) => group.members)
    memberIds: number[]
}
