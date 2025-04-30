import { Entity, PrimaryColumn, Column } from "../../../../src"

@Entity("example")
export class MysqlExample {
    @PrimaryColumn()
    id: string

    @Column({ type: "text", nullable: true })
    name: string | null

    @Column({ type: "int", nullable: true })
    value: number | null

    @Column({ type: "text", nullable: true })
    parentId: string | null

    @Column({ type: "boolean", nullable: true })
    active: boolean | null

    @Column({ type: "datetime", nullable: true })
    createdAt: Date | null

    @Column({ type: "text", nullable: true })
    tags: string | null
}
