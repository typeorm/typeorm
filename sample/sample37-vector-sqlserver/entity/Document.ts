import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../src/index"
import { DocumentChunk } from "./DocumentChunk"

@Entity("documents")
export class Document {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar")
    fileName: string

    @OneToMany(() => DocumentChunk, (chunk) => chunk.document)
    chunks: DocumentChunk[]
}
