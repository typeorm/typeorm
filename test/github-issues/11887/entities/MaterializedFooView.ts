import { ViewColumn, ViewEntity } from "../../../../src"

@ViewEntity({
    name: "materialized_foo_view",
    expression: "SELECT updated_at FROM foo",
})
export class MaterializedFooView {
    @ViewColumn({ name: "updated_at" })
    updatedAt: Date
}
