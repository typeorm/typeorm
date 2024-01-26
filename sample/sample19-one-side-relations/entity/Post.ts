import { Column, Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { Author } from "./Author"
import { ManyToOne } from "../../../src/decorator/relations/ManyToOne"
import { Category } from "./Category"
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany"
import { JoinTable } from "../../../src/decorator/relations/JoinTable"
import { OneToOne } from "../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../src/decorator/relations/JoinColumn"
import { PostMetadata } from "./PostMetadata"

@Entity("sample19_post")
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @ManyToOne((type) => Author, { cascade: true })
    author: Author

    @ManyToMany((type) => Category, { cascade: true })
    @JoinTable()
    categories: Category[]

    @OneToOne((type) => PostMetadata, { cascade: true })
    @JoinColumn()
    metadata: PostMetadata
}
