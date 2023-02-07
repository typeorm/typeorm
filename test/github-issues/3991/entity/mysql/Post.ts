import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "../../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: () => "CURRENT_TIMESTAMP" })
    col1: Date

    @Column({ default: () => "CURRENT_TIMESTAMP()" })
    col2: Date

    @Column({ precision: 3, default: () => "CURRENT_TIMESTAMP(3)" })
    col3: Date

    @Column({ default: () => "current_timestamp" })
    col4: Date

    @Column({ default: () => "current_timestamp()" })
    col5: Date

    @Column({ precision: 3, default: () => "current_timestamp(3)" })
    col6: Date

    @Column({ default: () => "NOW()" })
    col7: Date

    @Column({ precision: 3, default: () => "NOW(3)" })
    col8: Date

    @Column({ precision: 3, default: () => "now(3)" })
    col9: Date

    @CreateDateColumn({ precision: null, default: () => "CURRENT_TIMESTAMP" })
    col10: Date

    @CreateDateColumn({ precision: null, default: () => "CURRENT_TIMESTAMP()" })
    col11: Date

    @CreateDateColumn({ precision: 3, default: () => "CURRENT_TIMESTAMP(3)" })
    col12: Date

    @CreateDateColumn({ precision: null, default: () => "current_timestamp" })
    col13: Date

    @CreateDateColumn({ precision: 3, default: () => "current_timestamp(3)" })
    col14: Date

    @CreateDateColumn({ precision: null, default: () => "NOW()" })
    col15: Date

    @CreateDateColumn({ precision: 3, default: () => "NOW(3)" })
    col16: Date

    @CreateDateColumn({ precision: null, default: () => "now()" })
    col17: Date

    @CreateDateColumn({ precision: 3, default: () => "now(3)" })
    col18: Date

    @UpdateDateColumn({
        precision: null,
        default: () => "CURRENT_TIMESTAMP",
        onUpdate: "CURRENT_TIMESTAMP",
    })
    col19: Date

    @UpdateDateColumn({
        precision: null,
        default: () => "CURRENT_TIMESTAMP()",
        onUpdate: "CURRENT_TIMESTAMP()",
    })
    col20: Date

    @UpdateDateColumn({
        precision: 3,
        default: () => "CURRENT_TIMESTAMP(3)",
        onUpdate: "CURRENT_TIMESTAMP(3)",
    })
    col21: Date

    @UpdateDateColumn({
        precision: null,
        default: () => "current_timestamp",
        onUpdate: "current_timestamp",
    })
    col22: Date

    @UpdateDateColumn({
        precision: 3,
        default: () => "current_timestamp(3)",
        onUpdate: "current_timestamp(3)",
    })
    col23: Date

    @UpdateDateColumn({
        precision: null,
        default: () => "NOW()",
        onUpdate: "NOW()",
    })
    col24: Date

    @UpdateDateColumn({
        precision: 3,
        default: () => "NOW(3)",
        onUpdate: "NOW(3)",
    })
    col25: Date

    @UpdateDateColumn({
        precision: null,
        default: () => "now()",
        onUpdate: "now()",
    })
    col26: Date

    @UpdateDateColumn({
        precision: 3,
        default: () => "now(3)",
        onUpdate: "now(3)",
    })
    col27: Date
}
