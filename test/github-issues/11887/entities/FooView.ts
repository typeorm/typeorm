import { ViewColumn, ViewEntity } from "../../../../src"

@ViewEntity({
    name: "foo_view",
    expression: "SELECT updated_at FROM foo",
})
export class FooView {
    @ViewColumn()
    updatedAt: Date
}
