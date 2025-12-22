import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

@Entity()
export class Sale {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    product: string

    @Column()
    category: string

    @Column("decimal", { precision: 10, scale: 2 })
    amount: number

    @Column("date")
    date: Date
}
