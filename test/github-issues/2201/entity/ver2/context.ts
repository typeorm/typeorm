import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";

import { User } from "./user";
import { Record } from "./record";

@Entity({name: "record_contexts"})
export class RecordContext extends BaseEntity {
    @PrimaryColumn()
    recordId: string;

    @PrimaryColumn()
    userId: string;

    @ManyToOne(type => Record, record => record.contexts)
    public readonly record: Record;

    @ManyToOne(type => User, user => user.contexts)
    public readonly user: User;

    @Column("simple-json")
    public readonly meta: any;
}
