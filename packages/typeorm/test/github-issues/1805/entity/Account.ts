import { BaseEntity, Entity, PrimaryColumn } from "../../../../src"

@Entity("accounts")
export class Account extends BaseEntity {
    @PrimaryColumn("bigint")
    id: string
}
