import { Article } from "./Article"
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "../../../../../src"

@Entity()
export class ArticleDetails {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: String,
        nullable: true,
    })
    authorName: string | null

    @Column({
        type: String,
        nullable: true,
    })
    comment: string | null

    @Column({
        type: String,
        nullable: true,
    })
    metadata: string | null

    @OneToMany(() => Article, (article) => article.details, {
        cascade: true,
    })
    articles: Article[]
}
