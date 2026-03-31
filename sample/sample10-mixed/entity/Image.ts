import {
    Column,
    Entity,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../src/index"
import { Post } from "./Post"
import { ImageDetails } from "./ImageDetails"
import { JoinColumn } from "../../../src/decorator/relations/JoinColumn"

@Entity("sample10_image")
export class Image {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Post, (post) => post.images)
    post: Post

    @ManyToOne(() => Post, (post) => post.secondaryImages, {
        cascade: ["insert"],
    })
    secondaryPost: Post

    @OneToOne(() => ImageDetails, (details) => details.image, {
        cascade: true,
    })
    @JoinColumn()
    details: ImageDetails
}
