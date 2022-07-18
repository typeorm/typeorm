import { PrimaryColumn, Column, OneToMany } from "typeorm/index"
import { Entity } from "typeorm/decorator/entity/Entity"
import { BaseEntity } from "typeorm/repository/BaseEntity"

import { RecordContext } from "./context"

@Entity({ name: "records" })
export class Record extends BaseEntity {
    @PrimaryColumn()
    public id: string

    @OneToMany((type) => RecordContext, (context) => context.record)
    public contexts: RecordContext[]

    @Column()
    public status: "pending" | "failed" | "done"
}
