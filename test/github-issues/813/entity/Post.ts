import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Category[]
}
