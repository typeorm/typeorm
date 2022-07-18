import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToMany(() => Category, (category) => category.posts, {
        cascade: ["insert"],
    })
    categories: Category[]
}
