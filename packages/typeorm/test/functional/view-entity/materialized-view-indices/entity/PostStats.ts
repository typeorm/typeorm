import { Index, ViewColumn, ViewEntity } from "../../../../../src"

@ViewEntity({
    materialized: true,
    expression: `SELECT "categoryName", COUNT(*) AS "postCount" FROM "post" GROUP BY "categoryName"`,
})
export class PostStats {
    @Index("IDX_post_stats_category")
    @ViewColumn()
    categoryName: string

    @ViewColumn()
    postCount: number
}
