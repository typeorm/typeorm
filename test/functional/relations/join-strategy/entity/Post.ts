import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Author } from "./Author"
import { Category } from "./Category"
import { Comment } from "./Comment"
import { PostMeta } from "./PostMeta"
import { Profile } from "./Profile"
import { SoftDeleteAuthor } from "./SoftDeleteAuthor"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    // ManyToOne, nullable: false — should use INNER JOIN
    @ManyToOne(() => Author, { nullable: false })
    requiredAuthor: Author

    // ManyToOne, nullable: true (default) — should use LEFT JOIN
    @ManyToOne(() => Author)
    optionalAuthor: Author

    // ManyToOne, nullable: false, eager — should use INNER JOIN
    @ManyToOne(() => Author, { nullable: false, eager: true })
    eagerRequiredAuthor: Author

    // ManyToOne, nullable: true, eager — should use LEFT JOIN
    @ManyToOne(() => Author, { eager: true })
    eagerOptionalAuthor: Author

    // OneToOne owner, nullable: false — should use INNER JOIN
    @OneToOne(() => Profile, { nullable: false })
    @JoinColumn()
    requiredProfile: Profile

    // OneToOne owner, nullable: true (default) — should use LEFT JOIN
    @OneToOne(() => Profile)
    @JoinColumn()
    optionalProfile: Profile

    // OneToMany — should always use LEFT JOIN
    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[]

    // ManyToMany owner — should always use LEFT JOIN
    @ManyToMany(() => Category, (category) => category.posts)
    @JoinTable()
    categories: Category[]

    // OneToOne inverse (non-owner) — should always use LEFT JOIN
    @OneToOne(() => PostMeta, (meta) => meta.post)
    meta: PostMeta

    // ManyToOne, nullable: false, but target has @DeleteDateColumn — should use LEFT JOIN
    @ManyToOne(() => SoftDeleteAuthor, { nullable: false })
    requiredSoftDeleteAuthor: SoftDeleteAuthor
}
