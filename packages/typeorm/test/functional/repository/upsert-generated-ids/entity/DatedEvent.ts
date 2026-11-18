import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
export class DatedEvent {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column({ type: "date", unique: true })
    day: Date

    @Column()
    label: string

    @CreateDateColumn()
    createdAt: Date
}
