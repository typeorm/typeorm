import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from "../../../../../src"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ nullable: true, type: "text" })
    text: string | null

    @ManyToOne(() => Category, { nullable: true })
    @JoinColumn()
    category: Category | null
}
