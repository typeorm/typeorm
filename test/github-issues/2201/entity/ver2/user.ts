import { PrimaryColumn, OneToMany } from "typeorm/index"
import { Entity } from "typeorm/decorator/entity/Entity"
import { BaseEntity } from "typeorm/repository/BaseEntity"

import { RecordContext } from "./context"

@Entity({ name: "users" })
export class User extends BaseEntity {
    @PrimaryColumn()
    public id: string

    @OneToMany((type) => RecordContext, (context) => context.user)
    public contexts: RecordContext[]
}
