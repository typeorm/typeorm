import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { OrderStatus } from "./order.entity.ts"

@Entity()
export class OrderProduct extends BaseEntity {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column({ type: "enum", enum: OrderStatus })
    status: OrderStatus
}
