import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from "../../../../../src";
import { Author } from "./Author";
import { Tag } from "./Tag";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(() => Author, author => author.posts)
    author: Author;

    @ManyToMany(() => Tag)
    @JoinTable()
    tags: Tag[];
}
