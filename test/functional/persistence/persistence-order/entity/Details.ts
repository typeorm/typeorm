import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Post } from "./Post"
import { Photo } from "./Photo"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"

@Entity()
export class Details {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne((type) => Post, (post) => post.details)
    post: Post

    @OneToOne((type) => Photo, (photo) => photo.details, {
        nullable: false,
    })
    @JoinColumn()
    photo: Photo
}
