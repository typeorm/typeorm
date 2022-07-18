import { Column, PrimaryColumn, ManyToOne } from "typeorm/index"
import { Entity } from "typeorm/decorator/entity/Entity"
import { BaseEntity } from "typeorm/repository/BaseEntity"

import { User } from "./user"
import { Record } from "./record"

@Entity({ name: "record_contexts" })
export class RecordContext extends BaseEntity {
    @PrimaryColumn()
    recordId: string

    @PrimaryColumn()
    userId: string

    @ManyToOne((type) => Record, (record) => record.contexts)
    public readonly record: Record

    @ManyToOne((type) => User, (user) => user.contexts)
    public readonly user: User

    @Column()
    public readonly meta: string
}
