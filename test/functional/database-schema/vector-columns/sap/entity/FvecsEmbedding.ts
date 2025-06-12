import { Column, Entity, PrimaryColumn } from "../../../../../../src"

@Entity({ synchronize: false })
export class FvecsEmbedding {
    @PrimaryColumn()
    id: number

    @Column("nclob")
    content: string

    @Column("nclob")
    metadata: string

    @Column("real_vector")
    vector: Buffer
}
