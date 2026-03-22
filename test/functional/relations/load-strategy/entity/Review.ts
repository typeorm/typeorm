import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Book } from "./Book"

@Entity()
export class Review {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string

    @ManyToOne(() => Book, { eager: true })
    @JoinColumn()
    book: Book
}
