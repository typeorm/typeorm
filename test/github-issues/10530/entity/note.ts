import {
    Entity,
    Column,
    ManyToOne,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../src/"
import { Person } from "./person"

@Entity()
export class Note {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ unique: true })
    @Index({ unique: true })
    public externalId: string

    @ManyToOne((type) => Person, (person) => person.notes, { lazy: true })
    public owner: Promise<Person> | Person
}
