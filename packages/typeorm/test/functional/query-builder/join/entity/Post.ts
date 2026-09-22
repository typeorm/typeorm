import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { ManyToMany } from "../../../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../../../src/decorator/relations/JoinTable"
import { OneToOne } from "../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { User } from "./User"
import { Category } from "./Category"
import { CategoryWithCompositePK } from "./CategoryWithCompositePK"
import { Tag } from "./Tag"
import { Image } from "./Image"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Tag)
    tag: Tag

    @OneToOne(() => User)
    @JoinColumn()
    author: User

    @ManyToMany(() => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]

    @ManyToMany(() => CategoryWithCompositePK, (category) => category.posts)
    @JoinTable()
    compositePKCategories: CategoryWithCompositePK[]

    subcategories: Category[]

    removedCategories: Category[]

    images: Image[]
}
