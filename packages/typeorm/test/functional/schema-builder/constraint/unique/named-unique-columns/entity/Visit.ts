import { Column, Entity, PrimaryColumn, Unique } from "../../../../../../../src"

@Entity()
@Unique("visit_once", ["kind", "goal"])
export class Visit {
    @PrimaryColumn()
    id: number

    @Column()
    kind: string

    @Column()
    goal: string
}
