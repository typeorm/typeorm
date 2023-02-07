import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

export enum OrderStatus {
    placed = "placed",
    paid = "paid",
    confirmed = "confirmed",
    shipped = "shipped",
    completed = "completed",
    cancelled = "cancelled",
}

@Entity()
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "enum", enum: OrderStatus })
    status: OrderStatus
}
