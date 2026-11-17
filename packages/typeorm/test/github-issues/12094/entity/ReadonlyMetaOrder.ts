import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { OrderMeta } from "./Order"

/**
 * The embedded `meta` is exposed through a getter with no setter. Cloning the
 * entity for an upsert must not assign through that read-only accessor.
 */
@Entity()
export class ReadonlyMetaOrder {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    reference: string

    private readonly _meta: OrderMeta = new OrderMeta()

    @Column(() => OrderMeta)
    get meta(): OrderMeta {
        return this._meta
    }
}
