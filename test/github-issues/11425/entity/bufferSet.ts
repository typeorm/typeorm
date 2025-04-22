import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class bufferSet {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "bytea", select: false })
    BufferData: Buffer

    @Column({ type: "bytea", select: false })
    Uint8ArrayData: Uint8Array
}
