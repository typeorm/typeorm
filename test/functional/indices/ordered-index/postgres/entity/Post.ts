import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
} from "../../../../../../src"

@Entity()
@Index("IDX_POST_TITLE_NULLS_FIRST", ["title"], {
    columnOptions: {
        title: { nulls: "NULLS FIRST" },
    },
})
@Index("IDX_POST_DESCRIPTION_NULLS_LAST", ["description"], {
    columnOptions: {
        description: { nulls: "NULLS LAST" },
    },
})
@Index("IDX_POST_AUTHOR_ASC_NULLS_FIRST", ["author"], {
    columnOptions: {
        author: { order: "ASC", nulls: "NULLS FIRST" },
    },
})
@Index("IDX_POST_CATEGORY_DESC_NULLS_LAST", ["category"], {
    columnOptions: {
        category: { order: "DESC", nulls: "NULLS LAST" },
    },
})
@Index("IDX_POST_COMPOSITE", ["title", "author", "category"], {
    columnOptions: {
        title: { order: "ASC", nulls: "NULLS FIRST" },
        author: { order: "DESC", nulls: "NULLS LAST" },
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
    category: string

    @Column({ default: 0 })
    likes: number

    // Property-level index with shorthand syntax
    @Column({ nullable: true })
    @Index("IDX_POST_INFO_NULLS_FIRST", { nulls: "NULLS FIRST" })
    info: string

    @Column({ nullable: true })
    @Index("IDX_POST_RATING_DESC", { order: "DESC", nulls: "NULLS LAST" })
    rating: number
}
