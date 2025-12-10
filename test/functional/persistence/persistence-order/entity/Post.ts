import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { Category } from "./Category"
import { OneToOne } from "../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { Details } from "./Details"
import { Photo } from "./Photo"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne(() => Category, (category) => category.post, {
        nullable: true,
    })
    @JoinColumn()
    category: Category

    @OneToOne(() => Details, (details) => details.post, {
        nullable: false,
    })
    @JoinColumn()
    details: Details

    @OneToOne(() => Photo, (photo) => photo.post)
    photo: Photo
}
