import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity()
@TableInheritance({ column: { type: String, name: "type" } })
export class Order {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    orderNo: string

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number
}
