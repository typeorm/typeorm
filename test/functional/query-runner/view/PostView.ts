import { ViewColumn, ViewEntity } from "typeorm"

@ViewEntity({
    expression: `SELECT * FROM "post"`,
})
export class PostView {
    @ViewColumn()
    id: number

    @ViewColumn()
    type: string
}
