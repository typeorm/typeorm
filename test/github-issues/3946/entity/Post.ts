import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    title: string

    @Column()
    isRemoved: boolean = false

    @ManyToMany((type) => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]

    categoryCount: number

    removedCategoryCount: number
}
