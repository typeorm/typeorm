import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from "@typeorm/core";
import { Image } from "./Image";
import { Cover } from "./Cover";
import { Category } from "./Category";
import { PostDetails } from "./PostDetails";

@Entity("sample10_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: false
    })
    title: string;

    @Column({
        nullable: false
    })
    text: string;

    @OneToOne(type => PostDetails, details => details.post, {
        cascade: true
    })
    @JoinColumn()
    details: PostDetails;

    @OneToMany(type => Image, image => image.post, {
        cascade: true
    })
    images: Image[] = [];

    @OneToMany(type => Image, image => image.secondaryPost)
    secondaryImages: Image[];

    @ManyToOne(type => Cover, cover => cover.posts, {
        cascade: ["insert"]
    })
    @JoinColumn({name: "coverId"})
    cover: Cover;

    @Column("int", {
        nullable: true
    })
    coverId: number;

    @ManyToMany(type => Category, category => category.posts, {
        cascade: true
    })
    @JoinTable()
    categories: Category[];

}
