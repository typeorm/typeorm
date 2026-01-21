import {
    Entity,
    PrimaryGeneratedColumn,
    PrimaryColumn,
    Column,
} from "../../../../../src"

@Entity({
    name: "product",
    partition: {
        type: "LIST",
        columns: ["category"],
        partitions: [
            { name: "p_electronics", values: ["electronics", "computers"] },
            { name: "p_clothing", values: ["clothing", "shoes"] },
        ],
    },
})
export class Product {
    @PrimaryGeneratedColumn()
    id: number

    @PrimaryColumn()
    category: string

    @Column()
    name: string

    @Column("decimal", { precision: 10, scale: 2 })
    price: number
}
