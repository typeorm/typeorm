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

    @Column({ default: () => "CURRENT_TIMESTAMP(3)" })
    col2: Date

    @Column({ default: () => "current_timestamp" })
    col3: Date

    @Column({ default: () => "CURRENT_DATE" })
    col4: Date

    @Column({ default: () => "current_date" })
    col5: Date

    @Column({ default: () => "LOCALTIMESTAMP" })
    col6: Date

    @Column({ default: () => "LOCALTIMESTAMP(3)" })
    col7: Date

    @Column({ default: () => "localtimestamp" })
    col8: Date

    @Column({ default: () => "SYSDATE" })
    col9: Date

    @Column({ default: () => "sysdate" })
    col10: Date

    @Column({ default: () => "SYSTIMESTAMP" })
    col11: Date

    @Column({ default: () => "SYSTIMESTAMP(3)" })
    col12: Date

    @Column({ default: () => "systimestamp" })
    col13: Date

    @CreateDateColumn({ default: () => "CURRENT_TIMESTAMP" })
    col14: Date

    @CreateDateColumn({ default: () => "CURRENT_TIMESTAMP(3)" })
    col15: Date

    @CreateDateColumn({ default: () => "current_timestamp" })
    col16: Date

    @CreateDateColumn({ default: () => "CURRENT_DATE" })
    col17: Date

    @CreateDateColumn({ default: () => "current_date" })
    col18: Date

    @CreateDateColumn({ default: () => "LOCALTIMESTAMP" })
    col19: Date

    @CreateDateColumn({ default: () => "LOCALTIMESTAMP(3)" })
    col20: Date

    @CreateDateColumn({ default: () => "localtimestamp" })
    col21: Date

    @CreateDateColumn({ default: () => "SYSDATE" })
    col22: Date

    @CreateDateColumn({ default: () => "sysdate" })
    col23: Date

    @CreateDateColumn({ default: () => "SYSTIMESTAMP" })
    col24: Date

    @CreateDateColumn({ default: () => "SYSTIMESTAMP(3)" })
    col25: Date

    @CreateDateColumn({ default: () => "systimestamp" })
    col26: Date

    @UpdateDateColumn({ default: () => "CURRENT_TIMESTAMP" })
    col27: Date

    @UpdateDateColumn({ default: () => "CURRENT_TIMESTAMP(3)" })
    col28: Date

    @UpdateDateColumn({ default: () => "current_timestamp" })
    col29: Date

    @UpdateDateColumn({ default: () => "CURRENT_DATE" })
    col30: Date

    @UpdateDateColumn({ default: () => "current_date" })
    col31: Date

    @UpdateDateColumn({ default: () => "LOCALTIMESTAMP" })
    col32: Date

    @UpdateDateColumn({ default: () => "LOCALTIMESTAMP(3)" })
    col33: Date

    @UpdateDateColumn({ default: () => "localtimestamp" })
    col34: Date

    @UpdateDateColumn({ default: () => "SYSDATE" })
    col35: Date

    @UpdateDateColumn({ default: () => "sysdate" })
    col36: Date

    @UpdateDateColumn({ default: () => "SYSTIMESTAMP" })
    col37: Date

    @UpdateDateColumn({ default: () => "SYSTIMESTAMP(3)" })
    col38: Date

    @UpdateDateColumn({ default: () => "systimestamp" })
    col39: Date
}
