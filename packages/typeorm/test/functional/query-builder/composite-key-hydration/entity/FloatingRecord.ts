import { Entity, ManyToOne, OneToMany, PrimaryColumn } from "../../../../../src"

@Entity()
export class FloatingRecord {
    @PrimaryColumn()
    namespace: string

    @PrimaryColumn("double precision")
    key: number

    @ManyToOne(() => FloatingRecord, (record) => record.children)
    parent: FloatingRecord | null

    @OneToMany(() => FloatingRecord, (record) => record.parent)
    children: FloatingRecord[]
}
