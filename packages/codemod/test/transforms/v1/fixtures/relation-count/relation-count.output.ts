import { Entity } from "typeorm"

@Entity()
class Post {
    // TODO(typeorm-v1): `@RelationCount` was removed — use `@VirtualColumn` with a sub-query instead — see the v1 upgrading guide
    @RelationCount((post: Post) => post.categories)
    categoryCount: number

    // TODO(typeorm-v1): `@RelationCount` was removed — use `@VirtualColumn` with a sub-query instead — see the v1 upgrading guide
    @RC((post: Post) => post.tags)
    tagCount: number
}

// `.loadRelationCountAndMap()` was removed alongside @RelationCount
// TODO(typeorm-v1): `loadRelationCountAndMap()` was removed — use `@VirtualColumn` with a sub-query instead — see the v1 upgrading guide
const posts = await dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .getMany()
