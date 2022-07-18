import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"

@Entity("participants")
export class Participant {
    @PrimaryColumn()
    order_id: number

    @PrimaryColumn()
    distance: string

    @Column()
    price?: string
}
