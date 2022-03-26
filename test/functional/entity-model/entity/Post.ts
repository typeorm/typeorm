import {
    BaseEntity,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Category } from "./Category"

@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        nullable: true,
        unique: true,
    })
    externalId?: string

    @Column()
    title: string

    @Column({
        default: "This is default text.",
    })
    text: string

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Category[]
}
