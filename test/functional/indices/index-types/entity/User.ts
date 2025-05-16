import { Column, Entity, Index, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 255 })
    @Index({ type: "btree" })
    bTreeColumn: string

    @Column({ type: "varchar", length: 255 })
    @Index({ type: "hash" })
    hashColumn: string

    @Column({ type: "point" })
    @Index({ type: "gist" })
    gistColumn: string

    @Column({ type: "point" })
    @Index({ type: "spgist" })
    spgistColumn: string

    @Column("text", { array: true })
    @Index({ type: "gin" })
    ginColumn: string[]

    @Column({ type: "int" })
    @Index({ type: "brin" })
    brinColumn: number
}
