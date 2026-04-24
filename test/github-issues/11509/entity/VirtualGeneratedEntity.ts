import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../src/decorator/columns/Column"

@Entity("virtual_generated_entity")
export class VirtualGeneratedEntity {
    @PrimaryColumn("int")
    id: number

    @Column({ type: "varchar", nullable: true })
    name?: string

    @Column({
        type: "int",
        generatedType: "VIRTUAL",
        asExpression: "id * 3",
    })
    generated: number
}
