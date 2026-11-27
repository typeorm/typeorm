import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
} from "../../../../src"

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

    @CreateDateColumn()
    createdAt: Date

    @Column({ type: "text", nullable: true })
    tags: string | null
}
