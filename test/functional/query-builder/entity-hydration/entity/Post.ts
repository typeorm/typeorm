import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToOne,
    PrimaryColumn,
} from "../../../../../src"
import { Author } from "./Author"
import { Category } from "./Category"
import { Meta } from "./Meta"
import { Photo } from "./Photo"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column(() => Meta)
    meta: Meta

    @ManyToOne(() => Author, { nullable: true })
    author: Author

    /**
     * Deliberately a second relation to Author: "author" and "editor" are two aliases
     * sharing one entity metadata, which must still hydrate independently.
     */
    @ManyToOne(() => Author, { nullable: true })
    editor: Author

    @OneToOne(() => Photo, { nullable: true })
    @JoinColumn()
    photo: Photo

    @ManyToMany(() => Category)
    @JoinTable()
    categories: Category[]

    // filled in by loadRelationIdAndMap
    categoryIds: number[]
    authorId: number
    nested: { categoryIds: number[] }

    // filled in by leftJoinAndMapMany / leftJoinAndMapOne
    mappedCategories: Category[]
    mappedAuthor: Author
}
