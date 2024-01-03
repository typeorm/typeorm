import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from "../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number

    @CreateDateColumn({ type: "timestamp with time zone" })
    @Index("IX_User_createdAt")
    createdAt: Date
}
