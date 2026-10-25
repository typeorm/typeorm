import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../src/decorator/columns/PrimaryColumn"
import { Generated } from "../../../../../src/decorator/Generated"
import { DeleteDateColumn } from "../../../../../src/decorator/columns/DeleteDateColumn"
import { VersionColumn } from "../../../../../src/decorator/columns/VersionColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

// the primary key is a number in the database and a string in the entity
@Entity()
export class Invoice {
    @Generated("increment")
    @PrimaryColumn({
        type: "integer",
        transformer: {
            from: (databaseValue: number) => databaseValue?.toString(),
            to: (entityValue: string) =>
                entityValue ? Number(entityValue) : entityValue,
        },
    })
    id: string

    @Column()
    total: number

    @VersionColumn()
    version: number

    @DeleteDateColumn()
    deletedAt: Date | null
}
