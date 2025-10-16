import {
    Entity,
    PrimaryColumn,
    Column,
    Unique,
} from "../../../../../src"

@Entity()
@Unique(["text", "tag"])
// MongoDB does not support CHECK constraints; @Check omitted intentionally.
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ unique: true })
    version: number

    @Column({ default: "My post" })
    name: string

    @Column()
    text: string

    @Column()
    tag: string
}
