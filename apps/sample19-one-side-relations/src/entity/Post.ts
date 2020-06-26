import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn
} from "@typeorm/core";
import { Author } from "./Author";
import { Category } from "./Category";
import { PostMetadata } from "./PostMetadata";

@Entity("sample19_post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, {cascade: true})
    author: Author;

    @ManyToMany(type => Category, {cascade: true})
    @JoinTable()
    categories: Category[];

    @OneToOne(type => PostMetadata, {cascade: true})
    @JoinColumn()
    metadata: PostMetadata;

}
