import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Index } from "../../../../src"

@Entity()
@Index("unique_index", ["value", "other_value"], {
    unique: true,
    nullsNotDistinct: true,
})
export class IndexEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", nullable: true })
    value: string

    @Column({ type: "varchar", nullable: true })
    other_value: string
}
