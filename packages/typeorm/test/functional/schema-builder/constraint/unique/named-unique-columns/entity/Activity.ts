import { Column, Entity, PrimaryColumn, Unique } from "../../../../../../../src"

@Entity()
@Unique("activity_once", ["kind", "target"])
export class Activity {
    @PrimaryColumn()
    id: number

    @Column()
    kind: string

    @Column()
    target: string
}
