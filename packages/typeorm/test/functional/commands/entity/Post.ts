import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    title: string

    @CreateDateColumn()
    readonly createdAt?: Date
}
