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
import { User } from "./User";
import { Category } from "./Category";
import { Tag } from "./Tag";
import { Image } from "./Image";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Tag)
    tag: Tag;

    @OneToOne(type => User)
    @JoinColumn()
    author: User;

    @ManyToMany(type => Category, category => category.posts)
    @JoinTable()
    categories: Category[];

    subcategories: Category[];

    removedCategories: Category[];

    images: Image[];

}
