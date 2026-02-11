import { ArticleCategory } from "./ArticleCategory"
import { ArticleDetails } from "./ArticleDetails"
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    RelationId,
} from "../../../../../src"

@Entity()
export class Article {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @RelationId((article: Article) => article.category)
    categoryId: number

    @ManyToOne(() => ArticleCategory, {
        cascade: true,
    })
    category: ArticleCategory

    @RelationId((article: Article) => article.details)
    detailsId: number

    @ManyToOne(() => ArticleDetails, (details) => details.articles, {
        cascade: ["insert"],
    })
    details?: ArticleDetails
}
