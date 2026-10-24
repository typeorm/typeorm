import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity("mssql_output_value")
export class OutputValue {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "varchar",
        length: 10,
        dialectTypes: { mssql: "nvarchar(100)" },
    })
    wideText: string

    @Column({
        type: "decimal",
        precision: 8,
        scale: 2,
        dialectTypes: { mssql: "decimal(18,6)" },
    })
    amount: number

    @Column({
        type: "varchar",
        length: 20,
        nullable: true,
        dialectTypes: { mssql: "nvarchar(60)" },
    })
    optionalText: string | null

    @Column({ type: "varchar", length: 30 })
    plainText: string
}
