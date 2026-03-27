import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { TrimTransformer } from "./TrimTransformer"

@Entity()
export class SaveOneToManyAuthor {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ transformer: new TrimTransformer() })
    name: string

    @OneToMany(() => SaveOneToManyPost, (post) => post.author, {
        cascade: true,
        eager: true,
    })
    posts: SaveOneToManyPost[]
}

@Entity()
export class SaveOneToManyPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ transformer: new TrimTransformer() })
    title: string

    @ManyToOne(() => SaveOneToManyAuthor, (author) => author.posts)
    author: SaveOneToManyAuthor
}
