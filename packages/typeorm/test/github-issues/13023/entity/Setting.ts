import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity()
@Index(["key1", "key2"], { unique: true })
export class Setting {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column()
    key1: string

    @Column()
    key2: string

    @Column()
    value: string

    @CreateDateColumn()
    createdAt: Date
}
