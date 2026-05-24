import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Index(["key1", "key2"], { unique: true })
@Entity()
export class CompositeUniqueUpsertEntity {
    @PrimaryGeneratedColumn()
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
