import { Entity, RelationCount } from "typeorm"
import { RelationCount as RC } from "typeorm"

@Entity()
class Post {
    @RelationCount((post: Post) => post.categories)
    categoryCount: number

    @RC((post: Post) => post.tags)
    tagCount: number
}

// `.loadRelationCountAndMap()` was removed alongside @RelationCount
const posts = await dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .getMany()
