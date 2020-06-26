import { BaseEntity, Entity, PrimaryColumn } from "@typeorm/core";

@Entity("accounts")
export class Account extends BaseEntity {

    @PrimaryColumn("bigint")
    id: string;

}
