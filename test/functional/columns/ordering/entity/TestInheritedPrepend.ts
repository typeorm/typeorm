import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Order, Orderable } from "../../../../../src/decorator/order"
import { TimestampedEntity } from "./TimestampedEntity"

@Orderable()
@Entity()
export class TestInheritedPrepend extends TimestampedEntity {
    @Order({ priority: 110 })
    @PrimaryGeneratedColumn()
    id: number

    @Order({ priority: 110 })
    @Column()
    a: string

    @Order({ priority: 110 })
    @Column()
    b: string

    @Order({ priority: 110 })
    @Column()
    c: string

    @Order({ priority: 110 })
    @Column()
    d: string

    @Order({ priority: 110 })
    @Column()
    e: string

    @Order({ priority: 110 })
    @Column()
    f: string

    @Order({ priority: 110 })
    @Column()
    g: string

    @Order({ priority: 110 })
    @Column()
    h: string

    @Order({ priority: 110 })
    @Column()
    i: string
}
