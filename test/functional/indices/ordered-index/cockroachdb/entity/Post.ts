import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
} from "../../../../../../src"

@Entity()
@Index("IDX_POST_TITLE_ASC", ["title"], {
    columnOptions: {
        title: { order: "ASC" },
    },
})
@Index("IDX_POST_DESCRIPTION_DESC", ["description"], {
    columnOptions: {
        description: { order: "DESC" },
    },
})
@Index("IDX_POST_COMPOSITE", ["title", "author", "category"], {
    columnOptions: {
        title: { order: "ASC" },
        author: { order: "DESC" },
        // category intentionally has no options to test mixed scenarios
    },
})
@Index("IDX_POST_LIKES", ["likes"]) // Simple index without column options for backward compatibility test
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    title: string

    @Column({ nullable: true })
    description: string

    @Column({ nullable: true })
    author: string

    @Column({ nullable: true })
    @Index("IDX_POST_CATEGORY")
    category: string

    @Column({ default: 0 })
    likes: number

    // Property-level index with shorthand syntax
    @Column({ nullable: true })
    @Index("IDX_POST_INFO_ASC", { order: "ASC" })
    info: string

    @Column({ nullable: true })
    @Index("IDX_POST_RATING_DESC", { order: "DESC" })
    rating: number
}
