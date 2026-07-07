import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    DeleteDateColumn,
} from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    title: string

    @Column({ nullable: true })
    description: string

    @DeleteDateColumn()
    deletedAt?: Date
}
