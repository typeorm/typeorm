import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

/**
 * Same entity as Post but with a longer title column (50 → 100).
 * Used to test that changing the length generates ALTER COLUMN TYPE
 * instead of DROP + ADD (which would cause data loss).
 */
@Entity("post")
export class PostWithLongerTitle {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 100 })
    title: string
}
