import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../../src"

@Entity()
@Index("IDX_NAME_EMAIL", ["name", "email"], { unique: true })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Index("IDX_NAME")
    @Column()
    name: string

    @Column()
    email: string
}
