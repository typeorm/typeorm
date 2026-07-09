import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

/**
 * Same as Post but with title length changed from 255 to 500.
 * Used to verify that a length-only column change generates an ALTER statement.
 */
@Entity("post")
export class PostWithLongTitle {
    @PrimaryGeneratedColumn()
    id?: number

    @Column({ length: 500 })
    title: string

    @CreateDateColumn()
    readonly createdAt?: Date
}
