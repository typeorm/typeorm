import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { OneToMany } from "../typeorm/decorator/relations/OneToMany"
import { Column } from "../typeorm/decorator/columns/Column"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { EventMember } from "./EventMember"
import { Person } from "./Person"

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Person)
    author: Person

    @OneToMany((type) => EventMember, (member) => member.event)
    members: EventMember[]
}
