import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn"
import { Column } from "../../../../src/decorator/columns/Column"

// CockroachDB maps `int` to `int8` and the pg wire format returns `int8`
// values as JS strings. Other drivers in the matrix already return JS numbers.
// Coerce reads to number so cross-driver assertions like
// `expect(reloaded.generated).to.equal(202)` hold uniformly.
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
