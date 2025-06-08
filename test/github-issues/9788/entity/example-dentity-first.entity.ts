import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "../../../../src"
import { cEntity } from "./centity.entity"
import { dEntity } from "./dentity.entity"

@Entity("EXAMPLE")
export class ExampleDentityFirst {
    @PrimaryColumn("varchar", { name: "EXA_A" })
    a!: string

    @PrimaryColumn("varchar", { name: "EXA_B" })
    b!: string

    @ManyToOne(() => dEntity)
    @JoinColumn([
        { name: "EXA_A", referencedColumnName: "aToBNr" },
        { name: "EXA_B", referencedColumnName: "bNr" },
    ])
    bToD!: dEntity

    @ManyToOne(() => cEntity)
    @JoinColumn([{ name: "EXA_A", referencedColumnName: "aNr" }])
    aToC!: cEntity
}
