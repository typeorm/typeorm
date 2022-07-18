import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { ManyToMany } from "../typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "../typeorm/decorator/relations/JoinTable"
import { ManyToOne } from "../typeorm/decorator/relations/ManyToOne"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../typeorm/decorator/relations/JoinColumn"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Promise<Category[]>

    @ManyToMany((type) => Category, (category) => category.twoSidePosts)
    @JoinTable()
    twoSideCategories: Promise<Category[]>

    @Column()
    viewCount: number = 0

    @ManyToOne((type) => Category)
    category: Promise<Category>

    @OneToOne((type) => Category, (category) => category.onePost)
    @JoinColumn()
    oneCategory: Promise<Category>

    @ManyToOne((type) => Category, (category) => category.twoSidePosts2)
    twoSideCategory: Promise<Category>
}
