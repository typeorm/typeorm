import { ViewColumn, ViewEntity } from "../../../../src"

@ViewEntity({
    name: "foo_view",
    schema: "other_schema",
    expression: "SELECT updated_at FROM foo",
})
export class FooView {
    @ViewColumn({ name: "updated_at" })
    updatedAt: Date
}
