import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"

@Entity()
export class Category {
    @PrimaryColumn()
    tenantId: number

    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
