import { Column, Entity, PrimaryColumn } from "../../../../../src"

// cockroachdb returns int8 as string
const numericTransformer = {
    to: (value: number | undefined | null) => value,
    from: (value: number | string | null | undefined) =>
        value === null || value === undefined ? value : Number(value),
}

@Entity("stored_generated_entity")
export class StoredGeneratedEntity {
    @PrimaryColumn({ type: "int", transformer: numericTransformer })
    id: number

    @Column({ type: "varchar", nullable: true })
    name?: string

    @Column({
        type: "int",
        generatedType: "STORED",
        asExpression: "id * 2",
        transformer: numericTransformer,
    })
    generated: number
}
