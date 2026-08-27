import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../src"
import { Category } from "./Category"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    version: number

    @Column({ default: "My post" })
    name: string

    @Column()
    text: string

    @Column()
    tag: string

    @Column({ name: "profile.name", type: "varchar", nullable: true })
    profileName: string | null

    @ManyToOne(() => Category)
    @JoinColumn({ name: "categoryId" })
    category: Category | null
}
