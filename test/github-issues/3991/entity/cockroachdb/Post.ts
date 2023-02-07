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

    @Column({ type: "date", default: () => "CURRENT_DATE" })
    col1: Date

    @Column({ type: "date", default: () => "current_date" })
    col2: Date

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    col3: Date

    @Column({ type: "timestamp", default: () => "current_timestamp" })
    col4: Date

    @Column({ type: "timestamp", default: () => "NOW()" })
    col5: Date

    @Column({ type: "timestamp", default: () => "now()" })
    col6: Date

    @CreateDateColumn({ type: "date", default: () => "CURRENT_DATE" })
    col7: Date

    @CreateDateColumn({ type: "date", default: () => "current_date" })
    col8: Date

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    col9: Date

    @CreateDateColumn({ type: "timestamp", default: () => "current_timestamp" })
    col10: Date

    @CreateDateColumn({ type: "timestamp", default: () => "NOW()" })
    col11: Date

    @CreateDateColumn({ type: "timestamp", default: () => "now()" })
    col12: Date

    @UpdateDateColumn({ type: "date", default: () => "CURRENT_DATE" })
    col13: Date

    @UpdateDateColumn({ type: "date", default: () => "current_date" })
    col14: Date

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    col15: Date

    @UpdateDateColumn({ type: "timestamp", default: () => "current_timestamp" })
    col16: Date

    @UpdateDateColumn({ type: "timestamp", default: () => "NOW()" })
    col17: Date

    @UpdateDateColumn({ type: "timestamp", default: () => "now()" })
    col18: Date
}
