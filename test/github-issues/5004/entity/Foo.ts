import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Index } from "typeorm/decorator/Index"

@Entity()
export class Foo {
    @Column("date")
    @Index({ expireAfterSeconds: 0 })
    expireAt: Date
}
