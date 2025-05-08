import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Order, Orderable } from "../../../../../src/decorator/order"
import { TimestampedEntity } from "./TimestampedEntity"

@Orderable()
@Entity()
export class TestInheritedMiddleInsert extends TimestampedEntity {
    @Order({ priority: 50 })
    @PrimaryGeneratedColumn()
    id: number

    @Order({ priority: 50 })
    @Column()
    a: string

    @Order({ priority: 50 })
    @Column()
    b: string

    @Order({ priority: 50 })
    @Column()
    c: string

    @Order({ priority: 50 })
    @Column()
    d: string

    @Order({ priority: 50 })
    @Column()
    e: string

    @Order({ priority: 200 })
    @Column()
    f: string

    @Order({ priority: 200 })
    @Column()
    g: string

    @Order({ priority: 200 })
    @Column()
    h: string

    @Order({ priority: 200 })
    @Column()
    i: string
}
