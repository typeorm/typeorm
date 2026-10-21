import { Column, Entity, Index, PrimaryColumn } from "../../../../../../../src"

@Entity()
@Index("reversed_pair", ["zeta", "alpha"])
@Index(["zeta", "alpha", "mid"])
export class Reversed {
    @PrimaryColumn()
    id: number

    @Column()
    alpha: string

    @Column()
    mid: string

    @Column()
    zeta: string
}
