import { Entity, PrimaryColumn } from "../../../../src"

@Entity("DENTITY")
export class dEntity {
    @PrimaryColumn("varchar", { name: "DEN_ATOBNR" })
    aToBNr!: string

    @PrimaryColumn("varchar", { name: "DEN_BNR" })
    bNr!: string
}
