import { Entity } from "typeorm"

@Entity()
class Post {
    // TODO(typeorm-v1): `@RelationCount` was removed — use `QueryBuilder` with `loadRelationCountAndMap()` instead
    @RelationCount((post: Post) => post.categories)
    categoryCount: number

    // TODO(typeorm-v1): `@RelationCount` was removed — use `QueryBuilder` with `loadRelationCountAndMap()` instead
    @RC((post: Post) => post.tags)
    tagCount: number
}
