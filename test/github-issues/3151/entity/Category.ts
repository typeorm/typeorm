import { Column } from "../../../../src"
import { PrimaryGeneratedColumn } from "../../../../src"
import { Entity } from "../../../../src"
import { ManyToMany } from "../../../../src"
import { Note } from "./Note"

@Entity()
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @ManyToMany(() => Note, (note) => note.categories)
    notes: Note[]
}
