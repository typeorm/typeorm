import { Column } from "typeorm"
import { PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm"
import { ManyToMany } from "typeorm"
import { Note } from "./Note"

@Entity()
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @ManyToMany((type) => Note, (note) => note.categories)
    notes: Note[]
}
