import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { OneToMany } from "../typeorm/decorator/relations/OneToMany"
import { Column } from "../typeorm/decorator/columns/Column"
import { EventMember } from "./EventMember"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => EventMember, (member) => member.user)
    members: EventMember[]
}
