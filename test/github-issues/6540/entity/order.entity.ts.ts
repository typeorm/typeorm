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
    /**
     * modified to remove the uuid since some versions of mariadb have uuid as a type
     * which would create an additional upsert between the tests -> https://github.com/typeorm/typeorm/issues/8832
     */
    @PrimaryGeneratedColumn()
    id: string

    @Column({ type: "enum", enum: OrderStatus })
    status: OrderStatus
}
