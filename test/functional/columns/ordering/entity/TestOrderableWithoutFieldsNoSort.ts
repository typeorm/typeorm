import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Orderable } from "../../../../../src/decorator/order"

@Orderable()
@Entity()
export class TestOrderableWithoutFieldsNoSort {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    a: string

    @Column()
    b: string

    @Column()
    c: string

    @Column()
    d: string

    @Column()
    e: string

    @Column()
    f: string

    @Column()
    g: string

    @Column()
    h: string

    @Column()
    i: string
}
