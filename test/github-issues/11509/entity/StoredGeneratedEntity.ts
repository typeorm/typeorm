import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../src/decorator/columns/Column"

@Entity("stored_generated_entity")
export class StoredGeneratedEntity {
    @PrimaryColumn("int")
    id: number

    @Column({ type: "varchar", nullable: true })
    name?: string

    @Column({
        type: "int",
        generatedType: "STORED",
        asExpression: "id * 2",
    })
    generated: number
}
