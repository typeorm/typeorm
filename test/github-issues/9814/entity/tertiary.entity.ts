import { Entity, PrimaryColumn, Unique } from "../../../../src"

@Entity()
@Unique(["UserID"])
export class TypeormTestTertiary {
    @PrimaryColumn({ type: "int" })
    SecondaryID: number

    @PrimaryColumn({ type: "int" })
    UserID: number
}
