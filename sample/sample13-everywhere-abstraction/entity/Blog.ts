import { Column, Entity } from "../../../src/index"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"
import { PostCategory } from "./PostCategory"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"
import { BaseObject } from "./BaseObject"

@Entity("sample13_blog")
export class Blog extends BaseObject {
    @Column()
    text: string

    @ManyToMany(() => PostCategory, (category) => category.posts, {
        cascade: true,
    })
    @JoinTable()
    categories: PostCategory[] = []
}
