import { Index, ViewColumn, ViewEntity } from "../../../../../src"

@Index(["id"], { type: "hash" })
@ViewEntity({
    name: "user_view",
    materialized: true,
    expression: `
    SELECT
      id,
      "hashColumn"
    FROM "user"
  `,
})
export class User5 {
    @ViewColumn()
    id: number

    @Index({ type: "btree" })
    @ViewColumn()
    hashColumn: string
}
