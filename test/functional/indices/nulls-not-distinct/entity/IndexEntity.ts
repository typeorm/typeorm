import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Index } from "../../../../../src"

@Entity()
@Index("unique_index", ["value", "other_value"], {
    unique: true,
    nullsNotDistinct: true,
})
export class IndexEntityNullsNotDistinct {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "text", nullable: true })
    value: string

    @Column({ type: "text", nullable: true })
    other_value: string
}

@Entity()
@Index("unique_index", ["value", "other_value"], {
    unique: true,
    nullsNotDistinct: false,
})
export class IndexEntityNullsDistinct {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "text", nullable: true })
    value: string

    @Column({ type: "text", nullable: true })
    other_value: string
}
