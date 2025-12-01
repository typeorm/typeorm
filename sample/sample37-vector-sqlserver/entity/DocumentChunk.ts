import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "../../../src/index"
import { Document } from "./Document"

@Entity("document_chunks")
export class DocumentChunk {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { length: "MAX" })
    content: string

    @Column("vector", { length: 1998 })
    embedding: number[]

    @Column("uuid")
    documentId: string

    @ManyToOne(() => Document, (document) => document.chunks)
    @JoinColumn({ name: "documentId" })
    document: Document
}
