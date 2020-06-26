import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Author } from "./Author";
import { Category } from "./Category";

@Entity("sample21_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, author => author.posts, {
        cascade: true
    })
    @JoinColumn({ // todo: not yet fixed
        name: "user"
    })
    author: Author;

    @ManyToMany(type => Category, category => category.posts, {
        cascade: true
    })
    @JoinTable({
        name: "_post_categories"
    })
    categories: Category[];

}
