import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    name: string

    @Column()
    categoryId: string

    @ManyToOne(() => Category)
    @JoinColumn({ name: "categoryId" })
    category: Category
}
