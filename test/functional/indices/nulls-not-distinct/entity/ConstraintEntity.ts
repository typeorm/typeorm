import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Unique } from "../../../../../src"

@Entity()
@Unique("unique_constraint_nulls_not_distinct", ["value"], {
    nullsNotDistinct: true,
})
export class ConstraintEntityNullsNotDistinct {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "text", nullable: true })
    value: string
}

@Entity()
@Unique("unique_constraint_nulls_distinct", ["value"], {
    nullsNotDistinct: false,
})
export class ConstraintEntityNullsDistinct {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "text", nullable: true })
    value: string
}
