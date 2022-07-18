import { Entity, PrimaryColumn } from "typeorm"

@Entity("tests")
export class Test {
    @PrimaryColumn()
    varcharField: string

    @PrimaryColumn("uuid")
    uuidField: string

    @PrimaryColumn()
    intField: number
}
