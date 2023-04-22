import {
    Column,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Author } from "./Author"

@Entity()
export class PostWithCascade {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany(() => Author, (author) => author.postsWithCascade, {
        cascade: true,
    })
    authors: Author[]
}
