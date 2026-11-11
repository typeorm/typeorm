import { Column, Entity, PrimaryColumn } from "../../../../../src"

// cockroachdb returns int8 as string
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
