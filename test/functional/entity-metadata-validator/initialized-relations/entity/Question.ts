import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Category } from "./Category"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"

@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToMany((type) => Category, { persistence: false })
    @JoinTable()
    categories: Category[] = []
}
