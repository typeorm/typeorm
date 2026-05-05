import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../src/decorator/columns/Column"

// See StoredGeneratedEntity for why a numeric transformer is needed.
const numericTransformer = {
    to: (value: number | undefined | null) => value,
    from: (value: number | string | null | undefined) =>
        value === null || value === undefined ? value : Number(value),
}

@Entity("virtual_generated_entity")
export class VirtualGeneratedEntity {
    @PrimaryColumn({ type: "int", transformer: numericTransformer })
    id: number

    @Column({ type: "varchar", nullable: true })
    name?: string

    @Column({
        type: "int",
        generatedType: "VIRTUAL",
        asExpression: "id * 3",
        transformer: numericTransformer,
    })
    generated: number
}
