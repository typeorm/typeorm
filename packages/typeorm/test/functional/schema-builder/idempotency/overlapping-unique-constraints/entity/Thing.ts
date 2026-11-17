import { Column, Entity, PrimaryColumn, Unique } from "../../../../../../src"

@Entity()
@Unique("thing_long", ["first", "second", "third"])
@Unique("thing_short", ["first", "second"])
export class Thing {
    @PrimaryColumn()
    id: number

    @Column()
    first: string

    @Column()
    second: string

    @Column()
    third: string
}
