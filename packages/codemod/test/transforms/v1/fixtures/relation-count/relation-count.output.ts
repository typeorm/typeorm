import { Entity } from "typeorm"

@Entity()
class Post {
    @RelationCount((post: Post) => post.categories)
    categoryCount: number
}

// `.loadRelationCountAndMap()` was removed alongside @RelationCount
// TODO(typeorm-v1): `loadRelationCountAndMap()` was removed — use `@VirtualColumn` with a sub-query instead — see the v1 upgrading guide
const posts = await dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .getMany()
