import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { User } from "./User";
import { Editor } from "./Editor";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToMany(type => Category, {eager: true})
    @JoinTable()
    categories1: Category[];

    @ManyToMany(type => Category, category => category.posts2, {eager: true})
    categories2: Category[];

    @ManyToOne(type => User, {eager: true})
    author: User;

    @OneToMany(type => Editor, editor => editor.post, {eager: true})
    editors: Editor[];

}
