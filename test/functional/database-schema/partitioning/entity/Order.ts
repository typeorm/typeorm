import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity({
    name: "order",
    partition: {
        type: "LIST",
        columns: ["region"],
    },
})
export class Order {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    region: string

    @Column("decimal", { precision: 10, scale: 2 })
    amount: number

    @Column()
    customer: string
}
