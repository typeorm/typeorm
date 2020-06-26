import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";
import { Tag } from "./Tag";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(() => Category, category => category.posts, {
        cascade: ["insert"]
    })
    category: Promise<Category>;

    @ManyToMany(type => Tag, tag => tag.posts, {
        cascade: ["insert"]
    })
    @JoinTable()
    tags: Promise<Tag[]>;

}
