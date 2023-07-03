import { DataSource, ViewColumn, ViewEntity } from "../../../../src"
import { Foo } from "./Foo"

@ViewEntity({
    name: "foo_view",
    schema: "SYSTEM",
    expression: (connection: DataSource) =>
        connection.createQueryBuilder(Foo, "foo").select(`foo.updatedAt`),
})
export class FooView {
    @ViewColumn()
    updatedAt: Date
}
