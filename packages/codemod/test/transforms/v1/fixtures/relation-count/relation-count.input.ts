import { Entity, RelationCount } from "typeorm"

@Entity()
class Post {
    @RelationCount((post: Post) => post.categories)
    categoryCount: number
}

// `.loadRelationCountAndMap()` was removed alongside @RelationCount
const posts = await dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .getMany()
