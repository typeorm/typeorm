import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
} from "../../../../src"

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

    @CreateDateColumn({  precision: 3 })
    createdAt: Date

    @Column({ type: "text", nullable: true })
    tags: string | null
}
