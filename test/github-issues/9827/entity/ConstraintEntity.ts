import { Entity } from "../../../../src/decorator/entity/Entity"
import { Column } from "../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Unique } from "../../../../src"

@Entity()
@Unique("unique_constraint", ["value"], { nullsNotDistinct: true })
export class ConstraintEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", nullable: true })
    value: string
}
