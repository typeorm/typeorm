import { Entity } from "typeorm"

@Entity()
class Post {
    @RelationCount((post: Post) => post.categories)
    categoryCount: number
}
