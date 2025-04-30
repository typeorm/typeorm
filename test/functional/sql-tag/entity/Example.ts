import { Entity, PrimaryColumn, Column } from "../../../../src"

@Entity()
export class Example {
    @PrimaryColumn()
    id: string

    @Column({ type: "text", nullable: true })
    name: string | null

    @Column({ type: "integer", nullable: true })
    value: number | null

    @Column({ type: "text", nullable: true })
    parentId: string | null

    @Column({ type: "boolean", nullable: true })
    active: boolean | null

    @Column({ type: "timestamp", nullable: true })
    createdAt: Date | null

    @Column({ type: "jsonb", nullable: true })
    tags: string[] | null
}
