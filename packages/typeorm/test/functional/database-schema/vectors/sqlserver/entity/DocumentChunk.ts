import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class DocumentChunk {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { nullable: true })
    content: string

    @Column("vector", { length: 1998, nullable: true })
    embedding: number[]

    @Column("varchar", { nullable: true })
    documentId: string
}
