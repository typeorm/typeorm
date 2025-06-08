import { Entity, PrimaryColumn } from "../../../../src"

@Entity("CENTITY")
export class cEntity {
    @PrimaryColumn("varchar", { name: "CEN_ANR" })
    aNr: string
}
