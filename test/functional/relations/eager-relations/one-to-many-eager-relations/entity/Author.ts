import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { Article } from "./Article"
import { Comment } from "./Comment"

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Article, (article) => article.author, { eager: true })
    articles: Article[]

    @OneToMany(() => Comment, (comment) => comment.author, { eager: true })
    comments: Comment[]
}
