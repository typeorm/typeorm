import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    title: string

    @CreateDateColumn()
    readonly createdAt?: Date
}
