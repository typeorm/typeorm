import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Author } from "./Author"

@Entity()
export class Article {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    title: string

    @Column({ nullable: true })
    authorId: number

    @ManyToOne(() => Author, (author) => author.articles)
    @JoinColumn({ name: "authorId" })
    author: Author
}
