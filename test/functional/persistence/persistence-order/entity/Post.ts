import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Details } from "./Details"
import { Photo } from "./Photo"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne((type) => Category, (category) => category.post, {
        nullable: true,
    })
    @JoinColumn()
    category: Category

    @OneToOne((type) => Details, (details) => details.post, {
        nullable: false,
    })
    @JoinColumn()
    details: Details

    @OneToOne((type) => Photo, (photo) => photo.post)
    photo: Photo
}
