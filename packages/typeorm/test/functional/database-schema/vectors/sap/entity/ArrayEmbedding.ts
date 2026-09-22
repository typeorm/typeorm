import { Column, Entity, PrimaryColumn } from "../../../../../../src"

@Entity()
export class ArrayEmbedding {
    @PrimaryColumn()
    id: number

    @Column("nclob")
    content: string

    @Column("nclob")
    metadata: string

    @Column("real_vector", {
        length: 16,
    })
    smallVector: number[]

    @Column("real_vector", {
        length: 1536,
        nullable: true,
    })
    largeVector: number[] | null

    @Column("real_vector")
    variableVector: number[]
}
