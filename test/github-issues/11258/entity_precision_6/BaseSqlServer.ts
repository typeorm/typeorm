import { PrimaryColumn, UpdateDateColumn } from "../../../../src"

export abstract class BaseEntitySqlServer {
    @PrimaryColumn()
    id?: number

    // for precision 6 testing - SQL Server uses datetime2 and SYSDATETIME()
    // `updated_date` datetime2(6) NOT NULL DEFAULT SYSDATETIME()
    @UpdateDateColumn({
        type: "datetime2",
        precision: 6,
        default: () => "SYSDATETIME()",
        onUpdate: "SYSDATETIME()",
    })
    updated_date?: Date
}
