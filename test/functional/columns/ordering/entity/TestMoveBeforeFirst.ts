import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Order, Orderable } from "../../../../../src/decorator/order"

@Orderable()
@Entity()
export class TestMoveBeforeFirst {
    @Order({})
    @PrimaryGeneratedColumn()
    id: number

    @Order({})
    @Column()
    a: string

    @Order({ before: "id" })
    @Column()
    b: string

    @Order({})
    @Column()
    c: string

    @Order({})
    @Column()
    d: string

    @Order({})
    @Column()
    e: string

    @Order({})
    @Column()
    f: string

    @Order({})
    @Column()
    g: string

    @Order({})
    @Column()
    h: string

    @Order({})
    @Column()
    i: string
}
