import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class NullableTag {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ type: "varchar", unique: true, nullable: true })
    name: string | null
}
