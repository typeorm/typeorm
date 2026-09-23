import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    DeleteDateColumn,
} from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @DeleteDateColumn()
    deletedDate: Date
}
