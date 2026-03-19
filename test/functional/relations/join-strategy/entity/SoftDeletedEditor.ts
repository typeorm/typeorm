import {
    Column,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
export class SoftDeletedEditor {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @DeleteDateColumn()
    deletedAt: Date | null
}
