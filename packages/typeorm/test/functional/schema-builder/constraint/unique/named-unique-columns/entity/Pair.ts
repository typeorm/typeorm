import { Column, Entity, PrimaryColumn, Unique } from "../../../../../../../src"

@Entity()
@Unique("pair_once", ["first", "third"])
export class Pair {
    @PrimaryColumn()
    id: number

    @Column()
    first: string

    @Column()
    second: string

    @Column()
    third: string
}
