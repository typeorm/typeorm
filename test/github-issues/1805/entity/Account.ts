import { BaseEntity, Entity, PrimaryColumn } from "typeorm"

@Entity("accounts")
export class Account extends BaseEntity {
    @PrimaryColumn("bigint")
    id: string
}
