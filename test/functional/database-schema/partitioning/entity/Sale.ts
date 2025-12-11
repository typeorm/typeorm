import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity({
    name: "sale",
    partition: {
        type: "RANGE",
        expression: "YEAR(sale_date)",
        partitions: [
            { name: "p2023", values: ["2024"] },
            { name: "p2024", values: ["2025"] },
        ],
    },
})
export class Sale {
    @PrimaryGeneratedColumn()
    id: number

    @Column("date")
    sale_date: Date

    @Column("decimal", { precision: 10, scale: 2 })
    amount: number

    @Column()
    product: string
}
