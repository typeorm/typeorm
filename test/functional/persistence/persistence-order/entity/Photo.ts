import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./Post"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Details } from "./Details"
import { Category } from "./Category"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToOne((type) => Details, (details) => details.photo)
    details: Details

    @OneToOne((type) => Post, (post) => post.photo, {
        nullable: false,
    })
    @JoinColumn()
    post: Post

    @OneToOne((type) => Category, {
        nullable: false,
    })
    @JoinColumn()
    category: Category
}
