import { ValueTransformer } from "typeorm"
import { ViewColumn } from "typeorm/decorator/columns/ViewColumn"
import { ViewEntity } from "typeorm/decorator/entity-view/ViewEntity"

export const uppercase: ValueTransformer = {
    to: (entityValue: string) => {},
    from: (databaseValue: string) => databaseValue.toLocaleUpperCase(),
}
@ViewEntity({
    expression: `
    SELECT "post"."id" "id", "post"."name" AS "name", "category"."name" AS "categoryName"
    FROM "post" "post"
    LEFT JOIN "category" "category" ON "post"."categoryId" = "category"."id"
`,
})
export class PostCategory {
    @ViewColumn()
    id: number

    @ViewColumn({ name: "name" })
    postName: string

    @ViewColumn({ transformer: uppercase })
    categoryName: string
}
