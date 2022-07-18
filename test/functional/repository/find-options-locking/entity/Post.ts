import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { User } from "./User"
import { Category } from "./Category"
import { Tag } from "./Tag"
import { Image } from "./Image"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne((type) => Tag)
    tag: Tag

    @OneToOne((type) => User)
    @JoinColumn()
    author: User

    @ManyToMany((type) => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]

    subcategories: Category[]

    removedCategories: Category[]

    images: Image[]
}
