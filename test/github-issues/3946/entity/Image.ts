import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Category } from "./Category"

@Entity()
export class Image {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string

    @Column()
    isRemoved: boolean = false

    @ManyToMany((type) => Category, (category) => category.images)
    categories: Category[]

    categoryCount: number
}
