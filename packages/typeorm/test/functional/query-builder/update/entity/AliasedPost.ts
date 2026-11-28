import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"

/**
 * Target name ("AliasedPost") intentionally differs from the physical table
 * name ("post_table") to exercise DELETE/UPDATE alias handling when the two
 * cannot be conflated.
 */
@Entity("post_table")
export class AliasedPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}
