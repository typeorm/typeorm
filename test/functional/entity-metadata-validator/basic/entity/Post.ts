import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { RelationCount } from "typeorm/decorator/relations/RelationCount"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne((type) => Category)
    category: Category

    @ManyToMany((type) => Category)
    category2: Category

    @RelationCount((post: Post) => post.category)
    categoryCount: number

    @RelationCount((post: Post) => post.category2)
    categoryCount2: number
}
