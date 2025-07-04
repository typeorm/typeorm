import { PrimaryColumn, UpdateDateColumn } from "../../../../src"

export abstract class BaseEntitySqlServer {
    @PrimaryColumn()
    id?: number

    // for precision 3 testing - SQL Server uses datetime2 and SYSDATETIME()
    // `updated_date` datetime2(0) NOT NULL DEFAULT SYSDATETIME()
    @UpdateDateColumn({
        type: "datetime2",
        precision: 0,
        default: () => "GETDATE()",
        onUpdate: "GETDATE()",
    })
    updated_date?: Date
}
