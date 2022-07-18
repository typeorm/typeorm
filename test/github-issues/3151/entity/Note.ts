import { Column } from "typeorm"
import { PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm"
import { JoinTable } from "typeorm"
import { ManyToMany } from "typeorm"
import { Category } from "./Category"

@Entity()
export class Note {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    content: string

    @ManyToMany((type) => Category, (category) => category.notes)
    @JoinTable()
    categories: Category[]
}
