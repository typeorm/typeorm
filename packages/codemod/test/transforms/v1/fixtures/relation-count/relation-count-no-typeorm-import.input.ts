// File has no direct `typeorm` import but receives a QueryBuilder via a
// helper. The `.loadRelationCountAndMap()` call still needs to be flagged.
import type { SelectQueryBuilder } from "./helpers/types"
import { Post } from "./entity/Post"

export async function listWithCounts(
    qb: SelectQueryBuilder<Post>,
): Promise<Post[]> {
    return qb
        .loadRelationCountAndMap("post.categoryCount", "post.categories")
        .getMany()
}
