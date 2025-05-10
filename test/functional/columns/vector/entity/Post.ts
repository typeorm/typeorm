import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("vector", { dimensions: 3, nullable: true })
    embedding: number[]

    @Column("vector", { array: true, nullable: true })
    embeddings: number[][]
}
