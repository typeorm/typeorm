import { Column, Entity, PrimaryColumn } from "../../../../../../src"

@Entity()
export class BufferEmbedding {
    @PrimaryColumn()
    id: number

    @Column("nclob")
    content: string

    @Column("nclob")
    metadata: string

    @Column("real_vector")
    realVector: Buffer
}
