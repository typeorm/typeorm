import { Column, Entity, Index, PrimaryColumn } from "../../../../../../../src"

@Entity()
@Index("lookup_pair", ["first", "second"])
export class Lookup {
    @PrimaryColumn()
    id: number

    @Column()
    first: string

    @Column()
    second: string
}
