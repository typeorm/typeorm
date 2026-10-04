import { Entity, ManyToOne, OneToMany, PrimaryColumn } from "../../../../../src"

@Entity()
export class Record {
    @PrimaryColumn()
    namespace: string

    @PrimaryColumn()
    key: string

    @ManyToOne(() => Record, (record) => record.children)
    parent: Record | null

    @OneToMany(() => Record, (record) => record.parent)
    children: Record[]
}
