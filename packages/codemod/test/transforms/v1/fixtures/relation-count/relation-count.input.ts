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

// Multiple chained `.loadRelationCountAndMap()` calls on a single statement
// should receive exactly one TODO (idempotency)
const withBoth = await dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .loadRelationCountAndMap("post.tagCount", "post.tags")
    .getMany()

// Call inside a return statement
function listWithCounts() {
    return dataSource
        .createQueryBuilder(Post, "post")
        .loadRelationCountAndMap("post.categoryCount", "post.categories")
        .getMany()
}

// Call inside a throw — `ThrowStatement` should still be flagged
function fail() {
    throw new Error(
        dataSource
            .createQueryBuilder(Post, "post")
            .loadRelationCountAndMap("post.categoryCount", "post.categories")
            .getSql(),
    )
}

// Call inside a default export — `ExportDefaultDeclaration` should be flagged
export default dataSource
    .createQueryBuilder(Post, "post")
    .loadRelationCountAndMap("post.categoryCount", "post.categories")
    .getMany()

// Computed member access — should also be flagged
const computedCall = await dataSource
    .createQueryBuilder(Post, "post")
    ["loadRelationCountAndMap"]("post.categoryCount", "post.categories")
    .getMany()
