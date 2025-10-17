import { Entity, PrimaryColumn, Column, Unique } from "../../../../../src"

@Entity()
@Unique(["text", "tag"])
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
