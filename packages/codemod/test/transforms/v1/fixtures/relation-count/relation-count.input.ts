import { Entity, RelationCount } from "typeorm"
import { RelationCount as RC } from "typeorm"

@Entity()
class Post {
    @RelationCount((post: Post) => post.categories)
    categoryCount: number

    @RC((post: Post) => post.tags)
    tagCount: number
}
