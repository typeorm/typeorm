import { Entity, PrimaryGeneratedColumn, ManyToMany, JoinTable } from "typeorm"
import { Column } from "typeorm/decorator/columns/Column"
import { Category } from "./Category"

@Entity("questions")
export class Question {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany("categories")
    @JoinTable()
    categories: Category[]
}
