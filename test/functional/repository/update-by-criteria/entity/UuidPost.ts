import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { Generated } from "../../../../../src/decorator/Generated"

@Entity()
export class UuidPost {
    @PrimaryColumn("uuid")
    @Generated("uuid")
    id: string

    @Column()
    title: string
}
