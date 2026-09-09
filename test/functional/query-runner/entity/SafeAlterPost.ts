import { Column, Entity, PrimaryColumn } from "../../../../src"

/**
 * Entity used by the postgres-safe-alter test suite. Lives alongside the
 * other query-runner entities so it is auto-loaded by the existing test
 * harness. The columns are deliberately wide enough to exercise the
 * length-decrease and type-change paths.
 */
@Entity("safe_alter_post")
export class SafeAlterPost {
    @PrimaryColumn()
    id: number

    @Column({ type: "varchar", length: 50 })
    title: string

    @Column({ type: "text" })
    body: string

    @Column({ type: "integer" })
    counter: number
}
