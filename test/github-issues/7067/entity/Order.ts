import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    orderNo: string

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number
}
