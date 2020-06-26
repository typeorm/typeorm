import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from "@typeorm/core";

import { RecordContext } from "./context";

@Entity({name: "records"})
export class Record extends BaseEntity {
    @PrimaryColumn()
    public id: string;

    @OneToMany(type => RecordContext, context => context.record)
    public contexts: RecordContext[];

    @Column()
    public status: "pending" | "failed" | "done";
}
