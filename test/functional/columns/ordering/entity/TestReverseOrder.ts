import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Order, Orderable } from "../../../../../src/decorator/order"

@Orderable()
@Entity()
export class TestReverseOrder {
    @Order({ priority: 10 })
    @PrimaryGeneratedColumn()
    id: number

    @Order({ priority: 9 })
    @Column()
    a: string

    @Order({ priority: 8 })
    @Column()
    b: string

    @Order({ priority: 7 })
    @Column()
    c: string

    @Order({ priority: 6 })
    @Column()
    d: string

    @Order({ priority: 5 })
    @Column()
    e: string

    @Order({ priority: 4 })
    @Column()
    f: string

    @Order({ priority: 3 })
    @Column()
    g: string

    @Order({ priority: 2 })
    @Column()
    h: string

    @Order({ priority: 1 })
    @Column()
    i: string
}
