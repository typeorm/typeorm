import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Category)
    @JoinColumn()
    category: Category
}
