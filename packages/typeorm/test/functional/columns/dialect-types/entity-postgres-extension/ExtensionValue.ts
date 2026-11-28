import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity("dialect_extension_value")
export class ExtensionValue {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "varchar",
        length: 40,
        dialectTypes: { postgres: "citext" },
    })
    name: string
}
