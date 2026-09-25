import { Entity, Column, PrimaryGeneratedColumn, Index } from "../../../../src"

@Entity("sample_entity")
export class SampleEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @Index({ synchronize: false })
    title: string

    @Column()
    @Index("custom_unsynced_idx", { synchronize: false })
    tag: string
}
