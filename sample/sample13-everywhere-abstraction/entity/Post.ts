import { Column, Entity } from "../../../src/index"
import { PostCategory } from "./PostCategory"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"
import { BaseObject } from "./BaseObject"

@Entity("sample13_post")
export class Post extends BaseObject {
    @Column()
    text: string

    @ManyToMany((type) => PostCategory, (category) => category.posts, {
        cascade: true,
    })
    @JoinTable()
    categories: PostCategory[] = []
}
