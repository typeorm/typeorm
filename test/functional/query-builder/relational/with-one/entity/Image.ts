import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { Post } from "./Post"

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string

    @OneToOne((type) => Post, (post) => post.image)
    post: Post
}
