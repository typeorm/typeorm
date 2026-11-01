import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"

export class OrderMeta {
    @Column({ default: "pending" })
    status: string
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    reference: string

    @Column(() => OrderMeta)
    meta: OrderMeta
}
