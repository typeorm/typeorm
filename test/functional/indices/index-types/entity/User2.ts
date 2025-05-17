import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
export class User2 {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 255 })
    @Index({ type: "hash" })
    hashColumn: string
}
