import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { Person } from "./Person"

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    personId: string

    @OneToOne(() => Person, { cascade: true, onDelete: "CASCADE" })
    person: Person
}
