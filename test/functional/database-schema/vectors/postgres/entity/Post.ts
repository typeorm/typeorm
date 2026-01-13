import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Sparsevec } from "../../../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("vector", { nullable: true })
    embedding: number[]

    @Column("vector", { length: 3, nullable: true })
    embedding_three_dimensions: number[]

    @Column("halfvec", { nullable: true })
    halfvec_embedding: number[]

    @Column("halfvec", { length: 4, nullable: true })
    halfvec_four_dimensions: number[]

    @Column("sparsevec", { length: 5, nullable: true })
    sparse_embedding:
        | Sparsevec
        | number[]
        | Map<number, number>
        | Record<number, number>
        | string
        | null

    @Column("bit", { length: 16, nullable: true })
    bit_vector: string
}
