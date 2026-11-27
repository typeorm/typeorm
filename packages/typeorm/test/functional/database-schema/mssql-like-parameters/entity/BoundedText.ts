import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity({ name: "bounded_like_text" })
export class BoundedText {
    @PrimaryColumn()
    id: number

    @Column("nvarchar", { length: 20 })
    unicode: string

    @Column("varchar", { length: 20 })
    ascii: string
}
