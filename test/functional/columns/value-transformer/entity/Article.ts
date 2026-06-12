import { Entity, PrimaryColumn, Column, ManyToOne } from "../../../../../src"
import { Author, AuthorId } from "./Author"

export class ArticleId {
    constructor(public readonly value: string) {}
}

@Entity()
export class Article {
    @PrimaryColumn({
        type: "varchar",
        length: 255,
        transformer: {
            from(value: string) {
                return new ArticleId(value)
            },
            to(id: ArticleId) {
                return id.value
            },
        },
    })
    id!: ArticleId

    @ManyToOne(() => Author)
    author?: Author

    @Column({
        type: "varchar",
        length: 255,
        transformer: {
            from(value: string) {
                return new AuthorId(value)
            },
            to(id: AuthorId) {
                return id.value
            },
        },
    })
    authorId!: AuthorId
}
