import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

@Entity()
export class Item {
    @PrimaryColumn({ length: 36 })
    id: string

    // a type that accepts a length on every driver
    @Column({ length: 50 })
    name: string

    // whether these accept a length is a property of the driver, not of the
    // entity: `uuid` normalizes to `varchar` on mysql and stays native on
    // postgres, and the same holds for the other types across the drivers
    // typeorm supports. The length is carried and ignored where it does not
    // apply, so one entity definition can target several of them.
    @Column({ type: "uuid", length: 36 })
    reference: string

    @Column({ type: Number, length: 10 })
    counter: number
}
