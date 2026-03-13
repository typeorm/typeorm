import { PrimaryColumn } from "../../../../../src"

export class EmbeddedId {
    @PrimaryColumn("uuid")
    tenantId: string

    @PrimaryColumn("uuid")
    entityId: string
}
