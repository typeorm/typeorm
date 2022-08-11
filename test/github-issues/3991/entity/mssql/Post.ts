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

    @Column({ default: () => "current_timestamp" })
    col2: Date

    @Column({ default: () => "getdate()" })
    col3: Date

    @CreateDateColumn({ default: () => "CURRENT_TIMESTAMP" })
    col4: Date

    @CreateDateColumn({ default: () => "current_timestamp" })
    col5: Date

    @CreateDateColumn({ default: () => "getdate()" })
    col6: Date

    @UpdateDateColumn({ default: () => "CURRENT_TIMESTAMP" })
    col7: Date

    @UpdateDateColumn({ default: () => "current_timestamp" })
    col8: Date

    @UpdateDateColumn({ default: () => "getdate()" })
    col9: Date
}
