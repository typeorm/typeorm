import { Entity } from "../../../../src"
import { Column } from "../../../../src"
import { PrimaryGeneratedColumn } from "../../../../src"
import { CreateDateColumn } from "../../../../src"

@Entity()
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 100, nullable: true, unique: true })
    unique_column: string

    @Column({ type: "varchar", length: 100, nullable: true, unique: false })
    nonunique_column: string

    @CreateDateColumn({
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP(6)",
    })
    from: Date

    @CreateDateColumn({
        precision: 3,
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP(3)",
    })
    from2: Date

    @CreateDateColumn({
        precision: null,
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    from3: Date

    @Column({
        precision: null,
        type: "timestamp",
        default: null,
        nullable: true,
    })
    to: Date
}
