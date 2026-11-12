import { Column, Entity, Index, PrimaryColumn } from "../../../../../../../src"

@Entity()
@Index(["first", "second"])
export class Twin {
    @PrimaryColumn()
    id: number

    @Column()
    first: string

    @Column()
    second: string
}
