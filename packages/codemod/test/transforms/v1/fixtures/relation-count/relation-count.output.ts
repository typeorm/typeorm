import { Entity } from "typeorm"

@Entity()
class Post {
    // TODO(typeorm-v1): `@RelationCount` was removed — use `@VirtualColumn` with a sub-query instead
    @RelationCount((post: Post) => post.categories)
    categoryCount: number

    // TODO(typeorm-v1): `@RelationCount` was removed — use `@VirtualColumn` with a sub-query instead
    @RC((post: Post) => post.tags)
    tagCount: number
}

// `.loadRelationCountAndMap()` was removed alongside @RelationCount
// TODO(typeorm-v1): `loadRelationCountAndMap()` was removed — use `@VirtualColumn` with a sub-query instead
const posts = await dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .getMany()

// Multiple chained `.loadRelationCountAndMap()` calls on a single statement
// should receive exactly one TODO (idempotency)
// TODO(typeorm-v1): `loadRelationCountAndMap()` was removed — use `@VirtualColumn` with a sub-query instead
const withBoth = await dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .loadRelationCountAndMap("post.tagCount", "post.tags")
    .getMany()

// Call inside a return statement
function listWithCounts() {
    // TODO(typeorm-v1): `loadRelationCountAndMap()` was removed — use `@VirtualColumn` with a sub-query instead
    return dataSource
        .createQueryBuilder(Post, "post")
        .loadRelationCountAndMap("post.categoryCount", "post.categories")
        .getMany()
}

// Call inside a throw — `ThrowStatement` should still be flagged
function fail() {
    // TODO(typeorm-v1): `loadRelationCountAndMap()` was removed — use `@VirtualColumn` with a sub-query instead
    throw new Error(
        dataSource
            .createQueryBuilder(Post, "post")
            .loadRelationCountAndMap("post.categoryCount", "post.categories")
            .getSql(),
    )
}

// Call inside a default export — `ExportDefaultDeclaration` should be flagged
// TODO(typeorm-v1): `loadRelationCountAndMap()` was removed — use `@VirtualColumn` with a sub-query instead
export default dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .getMany()

// Computed member access — should also be flagged
// TODO(typeorm-v1): `loadRelationCountAndMap()` was removed — use `@VirtualColumn` with a sub-query instead
const computedCall = await dataSource
    .createQueryBuilder(Post, "post")
    ["loadRelationCountAndMap"]("post.categoryCount", "post.categories")
    .getMany()
