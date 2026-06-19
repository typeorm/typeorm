import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from "../../../../src"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ nullable: true, type: String })
    text: string | null

    @Column({ nullable: true, type: "simple-json" })
    payload: Record<string, unknown> | null

    @ManyToOne(() => Category, { nullable: true })
    @JoinColumn()
    category: Category | null
}
