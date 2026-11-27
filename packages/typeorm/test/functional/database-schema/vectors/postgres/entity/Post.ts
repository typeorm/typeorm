import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"

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
}
