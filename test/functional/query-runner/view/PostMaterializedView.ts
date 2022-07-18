import { ViewColumn, ViewEntity } from "typeorm"

@ViewEntity({
    expression: `SELECT * FROM "post"`,
    materialized: true,
})
export class PostMaterializedView {
    @ViewColumn()
    id: number

    @ViewColumn()
    type: string
}
