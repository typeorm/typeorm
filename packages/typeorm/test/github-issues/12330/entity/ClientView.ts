import type { DataSource } from "../../../../src"
import { JoinColumn, ManyToOne, ViewColumn, ViewEntity } from "../../../../src"
import { ClientRow } from "./ClientRow"
import { Group } from "./Group"

@ViewEntity({
    name: "client_view_12330",
    expression: (dataSource: DataSource) =>
        dataSource
            .createQueryBuilder()
            .select("c.id", "id")
            .addSelect("c.groupId", "groupId")
            .from(ClientRow, "c"),
})
export class ClientView {
    @ViewColumn()
    id: number

    @ViewColumn()
    groupId: number

    @ManyToOne(() => Group, (group) => group.currentClients)
    @JoinColumn({ name: "groupId" })
    group: Group
}
