import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Generated } from "typeorm/decorator/Generated"

@Entity("kollektion")
export class Kollektion {
    @PrimaryColumn({ name: "kollektion_id" })
    @Generated()
    id: number

    @Column({ name: "kollektion_name" })
    name: string
}
