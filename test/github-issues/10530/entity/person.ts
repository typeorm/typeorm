import {
    Entity,
    Column,
    OneToMany,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../src/"
import { Note } from "./note"

@Entity()
export class Person {
    @PrimaryGeneratedColumn()
    public id: number

    @Column({ unique: true })
    @Index({ unique: true })
    public externalId: string

    @OneToMany((type) => Note, (note) => note.owner, { lazy: true })
    public notes: Promise<Note[]> | Note[]
}
